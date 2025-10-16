let employeeData = [];
let currentStartDate = new Date(); // Начальная дата — текущая
currentStartDate.setUTCHours(3, 0, 0, 0); // Московское время (UTC+3)

// Загрузка данных
fetch('data-mr-pf.json')
    .then(response => response.json())
    .then(rawData => {
        employeeData = rawData.data.map(employee => ({
            name: `${employee.fio.family} ${employee.fio.name1[0]}.${employee.fio.name2[0]}.`,
            name_long: `${employee.fio.family} ${employee.fio.name1} ${employee.fio.name2}`,
            schedule: Object.entries(employee.schedule).map(([date, status]) => ({
                date: `2025-${date}`,
                status: status
            }))
        }));
        renderTables(employeeData);
    });

// Функция рендеринга таблиц
function renderTables(data, period = '3months') {
    const nameBody = document.getElementById('nameBody');
    const scheduleBody = document.getElementById('scheduleBody');
    const nameThead = document.getElementById('nameThead');
    const scheduleThead = document.getElementById('scheduleThead');
    nameBody.innerHTML = '';
    scheduleBody.innerHTML = '';
    nameThead.innerHTML = '';
    scheduleThead.innerHTML = '';

    const [dates, monthGroups] = setDates(period);

    // Рендерим thead для фиксированной колонки
    const emptyMonthTr = document.createElement('tr');
    const emptyMonthTh = document.createElement('th');
    emptyMonthTr.appendChild(emptyMonthTh);
    nameThead.appendChild(emptyMonthTr);

    const nameTr = document.createElement('tr');
    const nameTh = document.createElement('th');
    nameTh.textContent = '';
    nameTr.appendChild(nameTh);
    nameThead.appendChild(nameTr);

    // Рендерим thead для прокручиваемой таблицы
    const monthTr = document.createElement('tr');
    monthGroups.forEach(group => {
        const th = document.createElement('th');
        th.colSpan = group.colspan;
        th.textContent = group.month;
        monthTr.appendChild(th);
    });
    scheduleThead.appendChild(monthTr);

    const dayTr = document.createElement('tr');
    dates.forEach(dateStr => {
        const d = new Date(dateStr);
        const th = document.createElement('th');
        th.textContent = d.getDate();
        dayTr.appendChild(th);
    });
    scheduleThead.appendChild(dayTr);

    // Рендерим строки
    data.forEach(employee => {
        // Фиксированная колонка с именем
        const nameTr = document.createElement('tr');
        const nameTd = document.createElement('td');
        nameTd.textContent = employee.name;
        nameTd.title = employee.name_long;
        nameTr.appendChild(nameTd);
        nameBody.appendChild(nameTr);

        // Прокручиваемая таблица с расписанием
        const scheduleTr = document.createElement('tr');
        dates.forEach(date => {
            const td = document.createElement('td');
            const status = employee.schedule.find(s => s.date === date)?.status || '';
            td.textContent = status;
            td.className = status === 'Д' ? 'working' :
                           status === 'В' ? 'dayoff' :
                           status === 'У' ? 'study' :
                           status === 'О' ? 'vacation' : '';
            scheduleTr.appendChild(td);
        });
        scheduleBody.appendChild(scheduleTr);
    });
}

// Получение отфильтрованных данных
function getFilteredData() {
    const searchValue = document.getElementById('nameFilter').value.toLowerCase();
    return employeeData.filter(employee =>
        employee.name_long.toLowerCase().includes(searchValue)
    );
}

document.getElementById('nameFilter').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const period = document.getElementById('periodFilter').value;
        const filteredData = getFilteredData();
        renderTables(filteredData, period);
    }
});

// Фильтр по периоду
document.getElementById('periodFilter').addEventListener('change', function(e) {
    const period = e.target.value;
    renderTables(employeeData, period);
});

// Навигация по датам
document.getElementById('prevBtn').addEventListener('click', function() {
    const period = document.getElementById('periodFilter').value;
    const newDate = new Date(currentStartDate);
    if (period === '3months') {
        newDate.setMonth(newDate.getMonth() - 3);
    } else if (period === '1month') {
        newDate.setMonth(newDate.getMonth() - 1);
    } else {
        newDate.setDate(newDate.getDate() - 7);
    }
    currentStartDate = newDate;
    renderTables(employeeData, period);
});

document.getElementById('nextBtn').addEventListener('click', function() {
    const period = document.getElementById('periodFilter').value;
    const newDate = new Date(currentStartDate);    
    if (period === '3months') {
        newDate.setMonth(newDate.getMonth() + 3);
    } else if (period === '1month') {
        newDate.setMonth(newDate.getMonth() + 1);
    } else {
        newDate.setDate(newDate.getDate() + 7);
    }
    currentStartDate = newDate;
    renderTables(employeeData, period);
});

function setDates(period) {
    const months = ["январь", "февраль", "март", 
                    "апрель", "май", "июнь", 
                    "июль", "август", "сентябрь", 
                    "октябрь", "ноябрь", "декабрь"];

    let startDate = new Date();
    let endDate = new Date();

    if (period === '3months') {
        const quarter = Math.floor(currentStartDate.getMonth() / 3);
        startDate = new Date(currentStartDate.getFullYear(), 0, 1);
        endDate = new Date(currentStartDate.getFullYear(), 12, 0);
    } else if (period === '1month') {
        startDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), 1);
        endDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 1, 0);
    } else if (period === '7days') {
        const dayOfWeek = currentStartDate.getDay(); // 0=воскресенье, 1=понедельник, ..., 6=суббота
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(currentStartDate);
        startDate.setDate(currentStartDate.getDate() + mondayOffset);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
    }

    // Генерируем даты
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(currentDate.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' }).split('.')[2] + '-' +
                   (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
                   currentDate.getDate().toString().padStart(2, '0'));
        currentDate.setDate(currentDate.getDate() + 1);
    }    

    // Группировка по месяцам для colspan
    let monthGroups = [];
    let currentMonth = null;
    let colspan = 0;
    dates.forEach(dateStr => {
        const d = new Date(dateStr);
        const monthIndex = d.getMonth();
        if (monthIndex !== currentMonth) {
            if (colspan > 0) {
                monthGroups.push({ month: months[currentMonth], colspan });
            }
            currentMonth = monthIndex;
            colspan = 1;
        } else {
            colspan++;
        }
    });    
    if (colspan > 0) {
        monthGroups.push({ month: months[currentMonth], colspan });
    }

    return [dates, monthGroups];
}