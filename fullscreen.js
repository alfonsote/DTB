document.addEventListener('DOMContentLoaded', function() {
    // Wait for a short delay to ensure DOM is fully loaded
    setTimeout(() => {
        const taskList = document.getElementById('taskList');
        const newTaskInput = document.getElementById('newTask');
        const addTaskButton = document.getElementById('addTask');
        const statusDiv = document.getElementById('status');
        const closeButton = document.getElementById('closeButton');

        if (!taskList || !newTaskInput || !addTaskButton || !statusDiv || !closeButton) {
            console.error('Required DOM elements not found');
            return;
        }

        // Close window button
        closeButton.addEventListener('click', () => {
            window.close();
        });

        // Focus on task input when fullscreen opens
        newTaskInput.focus();

        // Load tasks
        chrome.storage.sync.get(['tasks'], function(result) {
            if (!result.tasks) {
                chrome.storage.sync.set({ tasks: [] }, function() {
                    renderTasks([]);
                });
            } else {
                renderTasks(result.tasks);
            }
        });

        // Add new task
        function addTask(title) {
            if (!title) {
                updateStatus('Please enter a task title');
                return;
            }

            const newTask = {
                id: Date.now(),
                title: title,
                completed: false,
                subtasks: [],
                expanded: false
            };

            chrome.storage.sync.get(['tasks'], function(result) {
                const tasks = result.tasks || [];
                tasks.push(newTask);
                chrome.storage.sync.set({ tasks: tasks }, function() {
                    renderTasks(tasks);
                    newTaskInput.value = '';
                    newTaskInput.focus();
                    updateStatus('Task added successfully');
                });
            });
        }

        // Add task button event listener
        addTaskButton.addEventListener('click', function() {
            const title = newTaskInput.value.trim();
            addTask(title);
        });

        // Add Enter key event listener for task input
        newTaskInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const title = newTaskInput.value.trim();
                addTask(title);
            }
        });

        // Add keyboard navigation for tasks
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                // Clear input and focus on it
                newTaskInput.value = '';
                newTaskInput.focus();
            }
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
                taskHeader.addEventListener('click', () => {
                    toggleTaskExpansion(task.id);
                });

                const collapseButton = document.createElement('span');
                collapseButton.className = `material-icons ${task.expanded ? 'expanded' : ''}`;
                collapseButton.textContent = 'chevron_right';
                collapseButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleTaskExpansion(task.id);
                });

                const taskTitle = document.createElement('span');
                taskTitle.className = `task-title ${task.completed ? 'task-completed' : ''}`;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'task-checkbox';
                checkbox.checked = task.completed;
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task.id);
                });
                
                const titleText = document.createElement('span');
                titleText.className = 'task-title-text';
                titleText.textContent = task.title;
                
                taskTitle.appendChild(checkbox);
                taskTitle.appendChild(titleText);

                const taskControls = document.createElement('div');
                taskControls.className = 'task-controls';

                const deleteButton = document.createElement('span');
                deleteButton.className = 'material-icons';
                deleteButton.textContent = 'delete';
                deleteButton.title = 'Delete Task';
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                });

                taskControls.appendChild(deleteButton);

                taskHeader.appendChild(collapseButton);
                taskHeader.appendChild(taskTitle);
                taskHeader.appendChild(taskControls);

                const subtaskList = document.createElement('div');
                subtaskList.className = `subtask-list ${task.expanded ? 'expanded' : ''}`;
                
                // Render subtasks
                task.subtasks.forEach((subtask, index) => {
                    const subtaskItem = document.createElement('div');
                    subtaskItem.className = 'subtask-item';
                    subtaskItem.dataset.id = subtask.id;

                    const subtaskTitle = document.createElement('span');
                    subtaskTitle.className = `subtask-title ${subtask.completed ? 'task-completed' : ''}`;
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'task-checkbox';
                    checkbox.checked = subtask.completed;
                    checkbox.addEventListener('change', () => toggleSubtaskCompletion(task.id, subtask.id));
                    
                    const titleInput = document.createElement('input');
                    titleInput.type = 'text';
                    titleInput.className = 'subtask-input';
                    titleInput.value = subtask.title;
                    titleInput.placeholder = 'Enter subtask';
                    
                    // Save on blur
                    titleInput.addEventListener('blur', () => {
                        if (titleInput.value.trim() === '') {
                            deleteSubtask(task.id, subtask.id);
                        } else {
                            updateSubtaskTitle(task.id, subtask.id, titleInput.value.trim());
                        }
                    });

                    // Create new subtask on Enter
                    titleInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (titleInput.value.trim() !== '') {
                                addSubtask(task.id, '');
                                // Focus on the new input after a short delay
                                setTimeout(() => {
                                    const inputs = subtaskList.querySelectorAll('.subtask-input');
                                    if (inputs.length > index + 1) {
                                        inputs[index + 1].focus();
                                    }
                                }, 0);
                            }
                        }
                    });
                    
                    subtaskTitle.appendChild(checkbox);
                    subtaskTitle.appendChild(titleInput);

                    const subtaskControls = document.createElement('div');
                    subtaskControls.className = 'subtask-controls';

                    const deleteSubtaskButton = document.createElement('span');
                    deleteSubtaskButton.className = 'material-icons';
                    deleteSubtaskButton.textContent = 'delete';
                    deleteSubtaskButton.title = 'Delete Subtask';
                    deleteSubtaskButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteSubtask(task.id, subtask.id);
                    });

                    subtaskControls.appendChild(deleteSubtaskButton);
                    subtaskItem.appendChild(subtaskTitle);
                    subtaskItem.appendChild(subtaskControls);
                    subtaskList.appendChild(subtaskItem);
                });

                // Add new subtask input when expanded
                if (task.expanded) {
                    const newSubtaskItem = document.createElement('div');
                    newSubtaskItem.className = 'subtask-item';
                    
                    const subtaskTitle = document.createElement('span');
                    subtaskTitle.className = 'subtask-title';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'task-checkbox';
                    checkbox.disabled = true;
                    
                    const titleInput = document.createElement('input');
                    titleInput.type = 'text';
                    titleInput.className = 'subtask-input';
                    titleInput.placeholder = 'Enter subtask';
                    
                    titleInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (titleInput.value.trim() !== '') {
                                addSubtask(task.id, titleInput.value.trim());
                                titleInput.value = '';
                                // Focus back on the input
                                setTimeout(() => {
                                    titleInput.focus();
                                }, 0);
                            }
                        }
                    });
                    
                    subtaskTitle.appendChild(checkbox);
                    subtaskTitle.appendChild(titleInput);
                    newSubtaskItem.appendChild(subtaskTitle);
                    subtaskList.appendChild(newSubtaskItem);

                    // Focus on the new input when task is expanded
                    if (task.subtasks.length === 0) {
                        titleInput.focus();
                    }
                }

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
                        return { 
                            ...task, 
                            expanded: !task.expanded
                        };
                    }
                    return task;
                });
                
                chrome.storage.sync.set({ tasks: updatedTasks }, function() {
                    renderTasks(updatedTasks);
                    // Focus on the first subtask input if task was expanded
                    if (updatedTasks.find(t => t.id === taskId)?.expanded) {
                        setTimeout(() => {
                            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
                            const firstInput = taskItem?.querySelector('.subtask-input');
                            if (firstInput) {
                                firstInput.focus();
                            }
                        }, 0);
                    }
                });
            });
        }

        // Add subtask
        function addSubtask(taskId, title) {
            chrome.storage.sync.get(['tasks'], function(result) {
                const tasks = result.tasks || [];
                const updatedTasks = tasks.map(task => {
                    if (task.id === taskId) {
                        const newSubtask = {
                            id: Date.now(),
                            title: title,
                            completed: false
                        };
                        return { 
                            ...task, 
                            subtasks: [...task.subtasks, newSubtask],
                            expanded: true
                        };
                    }
                    return task;
                });
                
                chrome.storage.sync.set({ tasks: updatedTasks }, function() {
                    renderTasks(updatedTasks);
                    updateStatus('Subtask added successfully');
                });
            });
        }

        // Delete task
        function deleteTask(taskId) {
            chrome.storage.sync.get(['tasks'], function(result) {
                const tasks = result.tasks || [];
                const updatedTasks = tasks.filter(task => task.id !== taskId);
                
                chrome.storage.sync.set({ tasks: updatedTasks }, function() {
                    renderTasks(updatedTasks);
                    updateStatus('Task deleted successfully');
                });
            });
        }

        // Delete subtask
        function deleteSubtask(taskId, subtaskId) {
            chrome.storage.sync.get(['tasks'], function(result) {
                const tasks = result.tasks || [];
                const updatedTasks = tasks.map(task => {
                    if (task.id === taskId) {
                        return {
                            ...task,
                            subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
                        };
                    }
                    return task;
                });
                
                chrome.storage.sync.set({ tasks: updatedTasks }, function() {
                    renderTasks(updatedTasks);
                    updateStatus('Subtask deleted successfully');
                });
            });
        }

        // Update subtask title
        function updateSubtaskTitle(taskId, subtaskId, newTitle) {
            chrome.storage.sync.get(['tasks'], function(result) {
                const tasks = result.tasks || [];
                const updatedTasks = tasks.map(task => {
                    if (task.id === taskId) {
                        const updatedSubtasks = task.subtasks.map(subtask => {
                            if (subtask.id === subtaskId) {
                                return { ...subtask, title: newTitle };
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

        function updateStatus(message) {
            statusDiv.textContent = message;
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
        }
    }, 100); // Small delay to ensure DOM is ready
}); 