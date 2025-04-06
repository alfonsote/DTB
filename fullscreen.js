document.addEventListener('DOMContentLoaded', function() {
    const taskList = document.getElementById('taskList');
    const closeButton = document.getElementById('closeButton');

    // Load tasks from storage
    chrome.storage.sync.get(['tasks'], function(result) {
        const tasks = result.tasks || [];
        renderTasks(tasks);
    });

    // Close window button
    closeButton.addEventListener('click', () => {
        window.close();
    });

    // Render tasks
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.dataset.id = task.id;

            const taskHeader = document.createElement('div');
            taskHeader.className = 'task-header';

            const collapseButton = document.createElement('span');
            collapseButton.className = `material-icons collapse-button ${task.expanded ? 'expanded' : ''}`;
            collapseButton.textContent = 'chevron_right';
            collapseButton.addEventListener('click', () => toggleTaskExpansion(task.id));

            const taskTitle = document.createElement('div');
            taskTitle.className = `task-title ${task.completed ? 'task-completed' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
            
            const titleText = document.createElement('span');
            titleText.className = 'task-title-text';
            titleText.textContent = task.title;
            
            taskTitle.appendChild(checkbox);
            taskTitle.appendChild(titleText);

            taskHeader.appendChild(collapseButton);
            taskHeader.appendChild(taskTitle);

            const subtaskList = document.createElement('div');
            subtaskList.className = `subtask-list ${task.expanded ? 'expanded' : ''}`;
            
            // Render subtasks
            task.subtasks.forEach(subtask => {
                const subtaskItem = document.createElement('div');
                subtaskItem.className = 'subtask-item';
                subtaskItem.dataset.id = subtask.id;

                const subtaskTitle = document.createElement('div');
                subtaskTitle.className = `subtask-title ${subtask.completed ? 'subtask-completed' : ''}`;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'task-checkbox';
                checkbox.checked = subtask.completed;
                checkbox.addEventListener('change', () => toggleSubtaskCompletion(task.id, subtask.id));
                
                const titleText = document.createElement('span');
                titleText.className = 'subtask-title-text';
                titleText.textContent = subtask.title;
                
                subtaskTitle.appendChild(checkbox);
                subtaskTitle.appendChild(titleText);
                subtaskItem.appendChild(subtaskTitle);
                subtaskList.appendChild(subtaskItem);
            });

            taskItem.appendChild(taskHeader);
            taskItem.appendChild(subtaskList);
            taskList.appendChild(taskItem);
        });
    }

    // Toggle task completion
    function toggleTaskCompletion(taskId) {
        chrome.storage.sync.get(['tasks'], function(result) {
            const tasks = result.tasks || [];
            const updatedTasks = tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, completed: !task.completed };
                }
                return task;
            });
            
            chrome.storage.sync.set({ tasks: updatedTasks }, function() {
                renderTasks(updatedTasks);
            });
        });
    }

    // Toggle subtask completion
    function toggleSubtaskCompletion(taskId, subtaskId) {
        chrome.storage.sync.get(['tasks'], function(result) {
            const tasks = result.tasks || [];
            const updatedTasks = tasks.map(task => {
                if (task.id === taskId) {
                    const updatedSubtasks = task.subtasks.map(subtask => {
                        if (subtask.id === subtaskId) {
                            return { ...subtask, completed: !subtask.completed };
                        }
                        return subtask;
                    });
                    return { ...task, subtasks: updatedSubtasks };
                }
                return task;
            });
            
            chrome.storage.sync.set({ tasks: updatedTasks }, function() {
                renderTasks(updatedTasks);
            });
        });
    }

    // Toggle task expansion
    function toggleTaskExpansion(taskId) {
        chrome.storage.sync.get(['tasks'], function(result) {
            const tasks = result.tasks || [];
            const updatedTasks = tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, expanded: !task.expanded };
                }
                return task;
            });
            
            chrome.storage.sync.set({ tasks: updatedTasks }, function() {
                renderTasks(updatedTasks);
            });
        });
    }
}); 