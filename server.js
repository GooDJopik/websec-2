const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

function parseSchedule(html) {
    const $ = cheerio.load(html);

    const days = [];
    $('.schedule__head-weekday').each((i, e) => {
        days.push($(e).text().trim());
    });

    const dates = [];
    $('.schedule__head-date').each((i, e) => {
        dates.push($(e).text().trim());
    });

    const matrix = [];
    const children = $('.schedule__items').children();

    for (let i = 0; i < children.length; i++) {
        const el = children.eq(i);

        if (el.hasClass('schedule__time')) {

            const items = el.find('.schedule__time-item');

            let time = '';
            if (items.length >= 2) {
                const start = items.eq(0).text().trim();
                const end = items.eq(1).text().trim();
                time = `${start} – ${end}`;
            } else {
                time = el.text().trim();
            }

            const cells = [];

            for (let d = 0; d < days.length; d++) {
                const cell = children.eq(i + 1 + d);
                const lessons = [];

                if (cell.length && (cell.hasClass('schedule__item') || cell.hasClass('schedule__item_show'))) {

                    cell.find('.schedule__lesson-wrapper').each((idx, el) => {
                        const l = $(el);

                        const subject = l.find('.schedule__discipline').text().trim();
                        if (!subject) return;

                        const place = l.find('.schedule__place').text().trim();

                        const teacher = l.find('.schedule__teacher').text().trim();

                        const type = l.find('.schedule__lesson-type-chip').text().trim();

                        let groupsInfo = '';
                        const g = l.find('.schedule__groups');

                        if (g.length) {
                            const gl = g.find('a');
                            groupsInfo = gl.length
                                ? gl.map((i, e) => $(e).text().trim()).get().join(', ')
                                : g.text().trim();
                        }

                        lessons.push({
                            subject,
                            teacher: teacher || '—',
                            place: place || '—',
                            type: type || '—',
                            groups: groupsInfo || null
                        });
                    });
                }

                cells.push(lessons);
            }

            matrix.push({
                time: time || '—',
                cells
            });

            i += days.length;
        }
    }

    return {
        days,
        dates,
        scheduleMatrix: matrix
    };
}

app.get('/api/schedule', async (req, res) => {
    const { groupId, week = '32' } = req.query;

    if (!groupId) {
        return res.status(400).json({ error: 'Не указана группа' });
    }

    try {
        const response = await axios.get(
            `https://ssau.ru/rasp?groupId=${groupId}&selectedWeek=${week}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );

        res.json({
            type: 'group',
            id: groupId,
            week,
            ...parseSchedule(response.data)
        });

    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Ошибка загрузки группы' });
    }
});

app.get('/api/teacher-schedule', async (req, res) => {
    const { staffId, week = '32' } = req.query;

    if (!staffId) {
        return res.status(400).json({ error: 'Не указан преподаватель' });
    }

    try {
        const response = await axios.get(
            `https://ssau.ru/rasp?staffId=${staffId}&selectedWeek=${week}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );

        res.json({
            type: 'teacher',
            id: staffId,
            week,
            ...parseSchedule(response.data)
        });

    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Ошибка загрузки преподавателя' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});