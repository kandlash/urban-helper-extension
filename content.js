// Функция для добавления кнопки "Add Homework"
function addButton() {
    const targetElement = document.querySelector(".tlk-homework__mark-button");

    if (targetElement && !document.querySelector("#homework-add-button")) {
        // Поле выбора даты
        const dateInput = document.createElement("input");
        dateInput.id = "homework-date-picker";
        dateInput.type = "date";
        dateInput.style.marginRight = "10px";
        dateInput.style.marginLeft = "10px";

        // Восстановление ранее выбранной даты
        chrome.storage.local.get('selectedDate', ({ selectedDate }) => {
            if (selectedDate) {
                dateInput.value = selectedDate;  // Устанавливаем сохраненную дату
            } else {
                dateInput.value = new Date().toISOString().split("T")[0]; // Устанавливаем сегодняшнюю дату по умолчанию
            }
        });

        dateInput.addEventListener("input", (event) => {
            const selectedDate = event.target.value;
            // Сохраняем выбранную дату
            chrome.storage.local.set({ selectedDate });
            fetchHomeworkCount(); // Обновляем количество домашек
        });

        // Кнопка добавления домашки
        const addButton = document.createElement("button");
        addButton.id = "homework-add-button";
        addButton.innerText = "Add Homework";
        addButton.style.padding = "10px";
        addButton.style.fontSize = "16px";
        addButton.style.marginLeft = "10px";
        addButton.type = "button";

        // Лейбл для количества домашек
        const countLabel = document.createElement("span");
        countLabel.id = "homework-count";
        countLabel.style.marginLeft = "10px";
        countLabel.innerText = "Homeworks today: 0";  // Default value

        // Добавляем элементы в DOM
        targetElement.parentNode.insertBefore(dateInput, targetElement.nextSibling);
        targetElement.parentNode.insertBefore(addButton, dateInput.nextSibling);
        targetElement.parentNode.insertBefore(countLabel, addButton.nextSibling);

        // Обработчик на кнопку добавления домашки
        addButton.addEventListener("click", addHomework);
        fetchHomeworkCount();  // Fetch and display the homework count on page load
    }
}

// Функция для добавления домашнего задания
function addHomework() {
    chrome.storage.local.get('userToken', ({ userToken }) => {
        const token = userToken;
        if (!token) {
            alert("You need to log in first!");
            return;
        }

        const dateInput = document.getElementById("homework-date-picker");
        const selectedDate = dateInput.value;

        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }

        const url = `https://urbanhelper.onrender.com/homework/add?token=${token}&date_str=${selectedDate}`;

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log("Homework added:", data);
            let dataCount = fetchHomeworkCount(); // Обновляем количество домашек

            // Показываем уведомление об успешном добавлении
            showNotification(`Homework added successfully! ${dataCount}`);
        })
        .catch(error => {
            console.error("Error adding homework:", error);
            showNotification("Failed to add homework", 5000);
        });
    });
}


// Функция для получения количества домашек на выбранную дату
function fetchHomeworkCount() {
    chrome.storage.local.get('userToken', ({ userToken }) => {
        const token = userToken;
        if (!token) {
            alert("You need to log in first!");
            return;
        }

        const dateInput = document.getElementById("homework-date-picker");
        const selectedDate = dateInput.value;

        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }

        const url = `https://urbanhelper.onrender.com/homework/get?token=${token}&date_str=${selectedDate}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data && typeof data.count === "number") {
                    document.getElementById("homework-count").innerText = `Homeworks on ${selectedDate}: ${data.count}`;
                    return 25;
                } else {
                    console.error("Unexpected response format:", data);
                }
            })
            .catch(error => {
                console.error("Error fetching homework count:", error);
            });
    });
}

// Функция для добавления кнопки с шаблоном комментария
function addCommentButton() {
    const targetComment = document.querySelector(".tlk-textarea");

    if (targetComment && !document.querySelector("#comment-add-button")) {
        const button = document.createElement("button");
        button.id = "comment-add-button";
        button.innerText = "Add Template";
        button.style.padding = "10px";
        button.style.fontSize = "16px";
        button.style.marginLeft = "10px";
        button.type = "button";

        // При клике забираем шаблон через API
        button.addEventListener("click", () => {
            chrome.storage.local.get('userToken', ({ userToken }) => {
                const token = userToken;
                if (!token) {
                    alert("You need to log in first!");
                    return;
                }

                // Запрос шаблона по токену
                fetch(`https://urbanhelper.onrender.com/templates/get?token=${token}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Template API Response:", data);
                    if (data && data.template) {
                        targetComment.value = data.template || "No template text found";
                        targetComment.focus();
                        button.style.marginRight = "200px";
                        button.style.marginBottom = "15px"
                    } else {
                        console.error("Unexpected response format:", data);
                    }
                })
                .catch(error => {
                    console.error("Error fetching template:", error);
                });
            });
        });
        let divchik = document.createElement("div");
        divchik.style.width = targetComment.style.width;
        divchik.id = "button-insert-template";
        divchik.appendChild(button);
        targetComment.parentNode.insertBefore(divchik, targetComment.nextSibling);
    }
}


function makeGitHubLinksClickable() {
    const div = document.querySelector('.tlk-homework__answer-text');

    if (!div) {
        console.error('Element with class "tlk-homework__answer-text" not found');
        return;
    }

    // Регулярное выражение для поиска ссылок на GitHub
    const githubLinkRegex = /https:\/\/github\.com[^\s<]+/g;

    // Проходим по всем дочерним элементам и текстовым узлам
    div.childNodes.forEach(node => {
        // Обрабатываем только текстовые узлы
        if (node.nodeType === Node.TEXT_NODE) {
            const matches = node.textContent.match(githubLinkRegex);
            if (matches) {
                // Создаем новый документ-фрагмент для замены текстового узла
                const fragment = document.createDocumentFragment();

                let lastIndex = 0;
                matches.forEach(match => {
                    // Создаем текст до ссылки
                    const textBeforeLink = document.createTextNode(node.textContent.slice(lastIndex, node.textContent.indexOf(match, lastIndex)));
                    fragment.appendChild(textBeforeLink);

                    // Создаем элемент ссылки и кнопку
                    const link = document.createElement('a');
                    link.href = match;
                    link.target = '_blank';

                    const button = document.createElement('button');
                    button.id = 'github-button';
                    button.style.marginLeft = '4px';
                    button.textContent = 'GitHub';

                    link.appendChild(button);
                    fragment.appendChild(document.createTextNode(match)); // Добавляем сам текст ссылки
                    fragment.appendChild(link);

                    // Обновляем индекс последнего совпадения
                    lastIndex = node.textContent.indexOf(match, lastIndex) + match.length;
                });

                // Добавляем оставшийся текст
                const textAfterLink = document.createTextNode(node.textContent.slice(lastIndex));
                fragment.appendChild(textAfterLink);

                // Заменяем оригинальный текстовый узел фрагментом
                div.replaceChild(fragment, node);
            }
        }
    });
}


// Функция для показа всплывающего уведомления
function showNotification(message, duration = 3000) {
    const notification = document.createElement("div");
    notification.className = "custom-notification";
    notification.innerText = message;

    document.body.appendChild(notification);

    // Плавное появление
    setTimeout(() => {
        notification.style.opacity = "1";
    }, 100);

    // Плавное исчезновение
    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
            notification.remove();
        }, 500); // Время для завершения анимации
    }, duration);
}


// Функция для добавления слушателей к строкам таблицы
function addEventListenersToRows() {
    const rows = document.querySelectorAll(".tlk-homeworks__table-row");

    rows.forEach(row => {
        if (!row.getAttribute('data-event-added')) {
            row.addEventListener("click", () => {
                setTimeout(() => {
                    addButton();
                    addCommentButton();
                    makeGitHubLinksClickable();
                }, 2000);
            });
            row.setAttribute('data-event-added', 'true');
        }
    });
}

// Наблюдатель за изменениями DOM
function observeRows() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === "childList" || mutation.type === "subtree") {
                addEventListenersToRows();
            }
        });
    });

    const container = document.querySelector(".tlk-homeworks__table-body");

    if (container) {
        observer.observe(container, { childList: true, subtree: true });
    } else {
        console.log("Container for rows not found.");
    }
}

// Функция ожидания появления элемента
function waitForElement(selector, callback, interval = 100, timeout = 5000) {
    const start = Date.now();
    const timer = setInterval(() => {
        const element = document.querySelector(selector);
        if (element || Date.now() - start >= timeout) {
            clearInterval(timer);
            if (element) callback(element);
        }
    }, interval);
}

// Добавление стилей для кнопок
// Добавление стилей для кнопок и уведомления
function addButtonStyles() {
    const style = document.createElement("style");
    style.innerHTML = `
        #homework-add-button, #comment-add-button, #github-button {
            background-color: #4CAF50;
            color: white;
            font-size: 16px;
            padding: 12px 20px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        #button-insert-template {
            display: flex;
            flex-direction: row-reverse;
            align-items: end;
        }

        #homework-add-button:hover, #comment-add-button:hover, #github-button:hover {
            background-color: #45a049;
            transform: translateY(-2px);
        }

        #homework-add-button:active, #comment-add-button:active {
            background-color: #3e8e41;
            transform: translateY(0);
        }

        #homework-count {
            font-size: 14px;
            color: #555;
            margin-left: 10px;
            display: inline-block;
            font-weight: normal;
        }

        .custom-notification {
            position: fixed;
            right: 20px;
            bottom: 20px;
            background-color: #323232;
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.5s;
            z-index: 1000;
        }
    `;
    document.head.appendChild(style);
}


// Вызов функции для добавления стилей
addButtonStyles();


// Инициализация скрипта
setTimeout(() => {
    observeRows();
    addEventListenersToRows();
}, 3000);
