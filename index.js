const rawData = {
    "users_id": "1000,1001",
    "data": [
        {
            "id": 1000,
            "fio": {
                "name1": "Петя",
                "family": "Петров",
                "name2": "Петрович"
            },
            "schedule": {
                "10-01": "В",
                "10-02": "В",
                "10-03": "У"
            }
        },
        {
            "id": 1001,
            "fio": {
                "name1": "Иван",
                "family": "Иванов",
                "name2": "Иванович"
            },
            "schedule": {
                "10-01": "Д",
                "10-02": "Д",
                "10-03": "Д"
            }
        }
    ]
};

// Преобразуем данные в удобный формат
const employeeData = rawData.data.map(employee => ({
    name: `${employee.fio.family} ${employee.fio.name1} ${employee.fio.name2}`,
    schedule: Object.entries(employee.schedule).map(([date, status]) => ({
        date: `2025-${date}`,
        status: status
    }))
}));

console.log(employeeData)

// Функция рендеринга таблиц
function renderTables(data, days = 7) {
    const nameBody = document.getElementById('nameBody');
    const scheduleBody = document.getElementById('scheduleBody');
    const scheduleHeader = document.getElementById('scheduleHeader');
    nameBody.innerHTML = '';
    scheduleBody.innerHTML = '';
    scheduleHeader.innerHTML = '';

    // Генерируем даты для заголовков
    const dates = Array.from({ length: days }, (_, i) => {
        const d = new Date(2025, 9, 1 + i); // Начинаем с 2025-10-01
        return d.toISOString().split('T')[0];
    });

    // Рендерим заголовки дат
    dates.forEach(date => {
        const th = document.createElement('th');
        th.textContent = date;
        scheduleHeader.appendChild(th);
    });

    // Рендерим строки
    data.forEach(employee => {
        // Фиксированная колонка с именем
        const nameTr = document.createElement('tr');
        const nameTd = document.createElement('td');
        nameTd.textContent = employee.name;
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

// Фильтр по имени
document.getElementById('nameFilter').addEventListener('input', function(e) {
    const searchValue = e.target.value.toLowerCase();
    const filteredData = employeeData.filter(employee =>
        employee.name.toLowerCase().includes(searchValue)
    );
    const days = parseInt(document.getElementById('periodFilter').value);
    renderTables(filteredData, days);
});

// Фильтр по периоду
document.getElementById('periodFilter').addEventListener('change', function(e) {
    const days = parseInt(e.target.value);
    const searchValue = document.getElementById('nameFilter').value.toLowerCase();
    const filteredData = employeeData.filter(employee =>
        employee.name.toLowerCase().includes(searchValue)
    );
    renderTables(filteredData, days);
});

// Начальный рендеринг
renderTables(employeeData);