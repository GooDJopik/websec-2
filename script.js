$(document).ready(function(){

    const API_URL = 'http://localhost:3000/api/schedule';
    const TEACHER_API_URL = 'http://localhost:3000/api/teacher-schedule';

    const groups = [
        { id:'1282690301', name:'6411-100503D', details:'10.05.03 Информационная безопасность автоматизированных систем (Очная)', year:'01.09.2025' },
        { id:'1282690279', name:'6412-100503D', details:'10.05.03 Информационная безопасность автоматизированных систем (Очная)', year:'01.09.2025' },
        { id:'1213641978', name:'6413-100503D', details:'10.05.03 Информационная безопасность автоматизированных систем (Очная)', year:'01.09.2025' }
    ];

    const teachers = [
        { id: '664017039', name: 'Борисов А.Н.' },
        { id: '335824546', name: 'Максимов А.И.' },
        { id: '432837452', name: 'Юзькив Р.Р.' },
        { id: '333991624', name: 'Веричев А.В.' },
        { id: '62061001', name: 'Мясников В.В.' },
        { id: '364272302', name: 'Агафонов А.А.' },
        { id: '544973937', name: 'Шапиро Д.А.' },        
        { id: '651422674', name: 'Позднякова Д.С.' },
        { id: '147619112', name: 'Кузнецов А.В.' },
    ];

    let weeks = [32,33,34,35,36];

    let currentWeekIndex = Math.floor((new Date() - new Date('2025-09-01')) / (7*24*60*60*1000));
    if(currentWeekIndex < 0) currentWeekIndex = 0;
    if(currentWeekIndex >= weeks.length) currentWeekIndex = weeks.length - 1;

    let currentGroupId = null;
    let currentTeacherId = null;

    let lastData = null;

    function updateWeekDisplay(){
        $('#currentWeek').text(`Неделя ${weeks[currentWeekIndex]}`);
        $('#prevWeek').prop('disabled', currentWeekIndex === 0);
        $('#nextWeek').prop('disabled', currentWeekIndex === weeks.length - 1);
    }

    function clearInfo(){
        $('#groupName').text('');
        $('#groupDetails').text('');
        $('#groupYear').text('');
    }

    function renderSchedule(days, dates, matrix){

        if(window.matchMedia("(min-width: 769px)").matches){

            let html = '<table class="schedule-table"><thead><tr><th>Время</th>';

            days.forEach((d,i)=>{
                html += `<th>${d}<br>${dates[i]}</th>`;
            });

            html += '</tr></thead><tbody>';

            matrix.forEach((row)=>{
                html += `<tr><td>${row.time || '—'}</td>`;

                row.cells.forEach(cell=>{
                    if(cell.length){
                        let inner = '';

                        cell.forEach(l=>{
                            let cls = l.type.toLowerCase().includes('лекция') ? 'lesson-lecture' :
                                      l.type.toLowerCase().includes('практика') ? 'lesson-practice' :
                                      l.type.toLowerCase().includes('лабораторная') ? 'lesson-lab' : 'lesson-other';

                            inner += `<div class="lesson-cell ${cls}">
                                <b>${l.subject}</b><br>
                                ${l.teacher}<br>
                                ${l.place}
                            </div>`;
                        });

                        html += `<td>${inner}</td>`;
                    } else {
                        html += '<td>—</td>';
                    }
                });

                html += '</tr>';
            });

            html += '</tbody></table>';
            $('#scheduleContainer').html(html);

        } else {

            let html = '';

            days.forEach((day, i)=>{
                html += `<div class="mobile-day"><h3>${day} - ${dates[i]}</h3>`;

                matrix.forEach((row)=>{
                    let lessons = row.cells[i];

                    if(lessons.length){
                        lessons.forEach(l=>{
                            html += `<div class="mobile-lesson">
                                <b>${l.subject}</b> | ${l.teacher} | ${l.place} | ${row.time}
                            </div>`;
                        });
                    } else {
                        html += `<div class="mobile-lesson">Нет занятий | ${row.time}</div>`;
                    }
                });

                html += '</div>';
            });

            $('#scheduleContainer').html(html);
        }
    }

    function renderSaved(){
        if(lastData){
            renderSchedule(lastData.days, lastData.dates, lastData.scheduleMatrix);
        }
    }

    function updateGroupInfo(group){
        $('#groupName').text(group.name || '');
        $('#groupDetails').text(group.details || '');
        $('#groupYear').text(group.year ? `Начало: ${group.year}` : '');
    }

    function updateTeacherInfo(teacher){
        $('#groupName').text(teacher.name || '');
        $('#groupDetails').text('Преподаватель');
        $('#groupYear').text('');
    }

    function loadGroup(id){
        currentGroupId = id;
        currentTeacherId = null;

        clearInfo();

        const group = groups.find(g => g.id == id);
        if(group) updateGroupInfo(group);

        $('#scheduleContainer').html('Загрузка...');

        $.get(API_URL, {groupId: id, week: weeks[currentWeekIndex]}, function(res){
            lastData = res;
            renderSchedule(res.days, res.dates, res.scheduleMatrix);
        });
    }

    function loadTeacher(id){
        currentTeacherId = id;
        currentGroupId = null;

        clearInfo();

        const teacher = teachers.find(t => t.id == id);
        if(teacher) updateTeacherInfo(teacher);

        $('#scheduleContainer').html('Загрузка...');

        $.get(TEACHER_API_URL, {staffId: id, week: weeks[currentWeekIndex]}, function(res){
            lastData = res;
            renderSchedule(res.days, res.dates, res.scheduleMatrix);
        });
    }

    function autocomplete(input){
        let val = input.val().toLowerCase();
        let ul = $('#suggestions').empty();

        let groupSuggestions = groups
            .filter(g => g.name.toLowerCase().includes(val))
            .map(g => ({...g, type: 'group'}));

        let teacherSuggestions = teachers
            .filter(t => t.name.toLowerCase().includes(val))
            .map(t => ({...t, type: 'teacher'}));

        let suggestions = [...groupSuggestions, ...teacherSuggestions];

        if(suggestions.length){
            suggestions.forEach(s=>{
                ul.append(`<li data-id="${s.id}" data-type="${s.type}">${s.name}</li>`);
            });
            ul.show();
        } else {
            ul.hide();
        }
    }

    $('#searchInput').on('keyup', function(){
        autocomplete($(this));
    });

    $(document).on('click', '#suggestions li', function(){
        let id = $(this).data('id');
        let type = $(this).data('type');

        $('#searchInput').val('');
        $('#suggestions').hide();

        if(type === 'teacher'){
            loadTeacher(id);
        } else {
            loadGroup(id);
        }
    });

    $('#prevWeek').click(function(){
        if(currentWeekIndex > 0){
            currentWeekIndex--;
            updateWeekDisplay();

            if(currentGroupId) loadGroup(currentGroupId);
            else if(currentTeacherId) loadTeacher(currentTeacherId);
        }
    });

    $('#nextWeek').click(function(){
        if(currentWeekIndex < weeks.length - 1){
            currentWeekIndex++;
            updateWeekDisplay();

            if(currentGroupId) loadGroup(currentGroupId);
            else if(currentTeacherId) loadTeacher(currentTeacherId);
        }
    });

    $(window).on('resize', function(){
        renderSaved();
    });

    updateWeekDisplay();

    let defaultGroup = groups.find(g => g.name === '6413-100503D');
    if(defaultGroup) loadGroup(defaultGroup.id);
});