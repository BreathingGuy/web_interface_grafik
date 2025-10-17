const table = document.getElementById('editableTable');
const status = document.getElementById('status');
let selectedCells = [];
let copiedCells = []
let startCell = null;
let undoStack = []
let undoSelectedAreaStack = []

// Обработка клавиш для копирования и вставки
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelected();
    }
    if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteSelected();
    }
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
});

// Начало выделения
table.addEventListener('mousedown', (e) => {
    if (e.target.tagName !== 'TD') return;
    e.preventDefault();
    clearSelection()
    
    if (!startCell && e.target.parentNode.parentNode.dataset.edit) {
        // Первый клик: фиксируем начальную ячейку
        startCell = e.target;
        startCell.classList.add('focused');
    }
});

// Завершение выделения
table.addEventListener('mouseup', (e) => {
    if (e.target.tagName !== 'TD') return;
    e.preventDefault();
    
    if (startCell) {
        // Второй клик: выделяем диапазон
        selectRange(startCell, e.target);
        startCell.classList.remove('focused');
        startCell = null;
    }
});

table.addEventListener('mouseover', (e) => {
    if (startCell) {
        if (e.target.tagName !== 'TD') return;
        e.preventDefault();
        clearSelection();
        selectRange(startCell, e.target);   

    }
})

// Предотвращаем контекстное меню
table.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

function toggleSelection(cell) {
    if (!cell.classList.contains('selected')) {
        cell.classList.add('selected');
        selectedCells.push(cell);
    }
}

function clearSelection() {
    selectedCells.forEach(cell => cell.classList.remove('selected'));
    selectedCells = [];
}

function selectRange(start, end) {
    const rows = Array.from(table.rows);
    const startRow = start.parentNode.rowIndex;
    const endRow = end.parentNode.rowIndex;
    const startCol = start.cellIndex;
    const endCol = end.cellIndex;

    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const cell = rows[r].cells[c];
            toggleSelection(cell);
        }
    }
    // console.log(selectedCells);
}


// Копирование массива ячеек
function copySelected() {
    if (selectedCells.length === 0) {
        status.textContent = 'Выберите ячейки для копирования';
        return;
    }

    const rows = Array.from(table.rows);
    const minRow = Math.min(...selectedCells.map(cell => cell.parentNode.rowIndex));
    const maxRow = Math.max(...selectedCells.map(cell => cell.parentNode.rowIndex));
    const minCol = Math.min(...selectedCells.map(cell => cell.cellIndex));
    const maxCol = Math.max(...selectedCells.map(cell => cell.cellIndex));

    // Формируем двумерный массив
    let data = [];
    for (let r = minRow; r <= maxRow; r++) {
        let rowData = [];
        for (let c = minCol; c <= maxCol; c++) {
            rowData.push(rows[r].cells[c].innerText);
        }
        data.push(rowData);
    }
    
    // Сериализуем массив в JSON и записываем в буфер
    const text = JSON.stringify(data);
    navigator.clipboard.writeText(text).then(() => {
        status.textContent = 'Скопировано в буфер обмена';
        setTimeout(() => status.textContent = '', 2000);
    }).catch(err => {
        status.textContent = 'Ошибка копирования: ' + err;
        console.error('Ошибка копирования:', err);
    });
}


// Вставка массива ячеек
function pasteSelected() {
    if (selectedCells.length === 0) {
        status.textContent = 'Выберите ячейки для вставки';
        return;
    }

    navigator.clipboard.readText().then(text => {
        let data;
        try {
            data = JSON.parse(text); // Десериализуем в массив
        } catch (err) {
            status.textContent = 'Ошибка: данные в буфере не являются массивом';
            setTimeout(() => status.textContent = '', 2000);
            return;
        }

        // Сохраняем текущее состояние перед вставкой
        saveState();

        const tableRows = Array.from(table.rows);
        const minRow = Math.min(...selectedCells.map(cell => cell.parentNode.rowIndex));
        const minCol = Math.min(...selectedCells.map(cell => cell.cellIndex));
        const maxRow = Math.max(...selectedCells.map(cell => cell.parentNode.rowIndex));
        const maxCol = Math.max(...selectedCells.map(cell => cell.cellIndex));
        const selectedRowsCount = maxRow - minRow + 1;
        const selectedColsCount = maxCol - minCol + 1;
        const clipboardRowsCount = data.length;
        const clipboardColsCount = data[0]?.length || 0; 
        
        // console.log(data);
        console.log(`SELECTED:  ${selectedRowsCount}, ${selectedColsCount}`);
        console.log(`CLIPBOARD:  ${clipboardRowsCount}, ${clipboardColsCount}`);
        console.log([minRow, maxRow, minCol, maxCol]);
        

        // Вставляем данные из массива
        if ((selectedColsCount == 1 && clipboardRowsCount == 1) || (selectedColsCount == clipboardColsCount && clipboardRowsCount == 1)) {
            console.log('1 ROW COPYING');
            for (let i = 0; i < selectedRowsCount; i++) {
                data.forEach((row, rIndex) => {
                    row.forEach((value, cIndex) => {
                        const targetRow = minRow + rIndex + i;
                        const targetCol = minCol + cIndex;
                        if (tableRows[targetRow] && tableRows[targetRow].cells[targetCol]) {
                            tableRows[targetRow].cells[targetCol].innerText = value;
                        }
                    });
                });
            }
        } else if (selectedRowsCount % clipboardRowsCount == 0 && selectedColsCount % clipboardColsCount == 0) {
            console.log('COPYING KVADRAT');
            for (let j = 0; j < selectedColsCount; j += clipboardColsCount) {
                for (let i = 0; i < selectedRowsCount; i += clipboardRowsCount) {
                    data.forEach((row, rIndex) => {
                        row.forEach((value, cIndex) => {
                            const targetRow = minRow + rIndex + i;
                            const targetCol = minCol + cIndex + j;
                            if (tableRows[targetRow] && tableRows[targetRow].cells[targetCol]) {
                                tableRows[targetRow].cells[targetCol].innerText = value;
                            }
                        });
                    });
                }
            }
        } else {
            console.log('BASIC COPYING');
            data.forEach((row, rIndex) => {
                row.forEach((value, cIndex) => {
                    const targetRow = minRow + rIndex;
                    const targetCol = minCol + cIndex;
                    if (tableRows[targetRow] && tableRows[targetRow].cells[targetCol]) {
                        tableRows[targetRow].cells[targetCol].innerText = value;
                    }
                });
            });
        }

        status.textContent = `Вставлено ${data.length}x${data[0]?.length || 0} значений`;
        setTimeout(() => status.textContent = '', 2000);
    }).catch(err => {
        status.textContent = 'Ошибка вставки: ' + err;
        console.error('Ошибка вставки:', err);
    });
}

// Сохранение состояния таблицы перед изменением
function saveState() {
    const rows = Array.from(table.rows);
    const state = [];
    for (let r = 0; r < rows.length; r++) {
        const rowData = [];
        for (let c = 0; c < rows[r].cells.length; c++) {
            rowData.push(rows[r].cells[c].innerText);
        }
        state.push(rowData);
    }
    undoStack.push(state);
}

// Восстановление предыдущего состояния
function undo() {
    if (undoStack.length === 0) {
        status.textContent = 'Нет изменений для отмены';
        setTimeout(() => status.textContent = '', 2000);
        return;
    }

    const state = undoStack.pop();
    const tableRows = Array.from(table.rows);
    state.forEach((row, rIndex) => {
        row.forEach((value, cIndex) => {
            if (tableRows[rIndex] && tableRows[rIndex].cells[cIndex]) {
                tableRows[rIndex].cells[cIndex].innerText = value;
            }
        });
    });

    status.textContent = 'Изменения отменены';
    setTimeout(() => status.textContent = '', 2000);
}