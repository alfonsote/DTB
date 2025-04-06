document.addEventListener('DOMContentLoaded', function() {
    const enabledSwitch = document.getElementById('enabled');
    const timeLimitInput = document.getElementById('timeLimit');
    const resetButton = document.getElementById('resetButton');
    const statusDiv = document.getElementById('status');
    const newWebsiteInput = document.getElementById('newWebsite');
    const addWebsiteButton = document.getElementById('addWebsite');
    const websiteList = document.getElementById('websiteList');
    const blockAllTabsSwitch = document.getElementById('blockAllTabs');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const newTaskInput = document.getElementById('newTask');
    const addTaskButton = document.getElementById('addTask');
    const taskList = document.getElementById('taskList');
    const fullscreenButton = document.getElementById('fullscreenButton');

    // Default websites
    const defaultWebsites = [
        { domain: 'youtube.com', enabled: true },
        { domain: 'instagram.com', enabled: true }
    ];

    // Load saved settings
    chrome.storage.sync.get(['enabled', 'timeLimit', 'websites', 'blockAllTabs', 'tasks'], function(result) {
        enabledSwitch.checked = result.enabled !== false;
        timeLimitInput.value = result.timeLimit || 30;
        blockAllTabsSwitch.checked = result.blockAllTabs || false;
        
        // Initialize websites if not set
        if (!result.websites) {
            chrome.storage.sync.set({ websites: defaultWebsites }, function() {
                renderWebsites(defaultWebsites);
            });
        } else {
            renderWebsites(result.websites);
        }

        // Initialize tasks if not set
        if (!result.tasks) {
            chrome.storage.sync.set({ tasks: [] }, function() {
                renderTasks([]);
            });
        } else {
            renderTasks(result.tasks);
        }
    });

    // Save settings when changed
    enabledSwitch.addEventListener('change', function() {
        chrome.storage.sync.set({ enabled: this.checked }, function() {
            updateStatus(`Extension ${this.checked ? 'enabled' : 'disabled'}`);
        }.bind(this));
    });

    blockAllTabsSwitch.addEventListener('change', function() {
        chrome.storage.sync.set({ blockAllTabs: this.checked }, function() {
            updateStatus(`Block all tabs ${this.checked ? 'enabled' : 'disabled'}`);
        }.bind(this));
    });

    timeLimitInput.addEventListener('change', function() {
        const timeLimit = parseInt(this.value);
        if (timeLimit > 0) {
            chrome.storage.sync.set({ timeLimit: timeLimit }, function() {
                updateStatus(`Time limit set to ${timeLimit} seconds`);
            });
        } else {
            this.value = 30;
            updateStatus('Time limit must be greater than 0');
        }
    });

    // Add new website
    addWebsiteButton.addEventListener('click', function() {
        const domain = newWebsiteInput.value.trim().toLowerCase();
        if (!domain) {
            updateStatus('Please enter a website domain');
            return;
        }

        // Validate domain format
        if (!isValidDomain(domain)) {
            updateStatus('Please enter a valid domain (e.g., youtube.com)');
            return;
        }

        chrome.storage.sync.get(['websites'], function(result) {
            const websites = result.websites || [];
            
            // Check if website already exists
            if (websites.some(w => w.domain === domain)) {
                updateStatus('Website already exists in the list');
                return;
            }

            // Add new website
            websites.push({ domain: domain, enabled: true });
            chrome.storage.sync.set({ websites: websites }, function() {
                renderWebsites(websites);
                newWebsiteInput.value = '';
                updateStatus('Website added successfully');
            });
        });
    });

    // Render websites list
    function renderWebsites(websites) {
        websiteList.innerHTML = '';
        websites.forEach(website => {
            const websiteItem = document.createElement('div');
            websiteItem.className = `website-item ${!website.enabled ? 'disabled-website' : ''}`;
            
            const websiteName = document.createElement('span');
            websiteName.textContent = website.domain;
            
            const controls = document.createElement('div');
            controls.className = 'website-controls';
            
            const toggleButton = document.createElement('button');
            toggleButton.className = 'button';
            toggleButton.textContent = website.enabled ? 'Disable' : 'Enable';
            toggleButton.addEventListener('click', function() {
                toggleWebsite(website.domain);
            });
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', function() {
                deleteWebsite(website.domain);
            });
            
            controls.appendChild(toggleButton);
            controls.appendChild(deleteButton);
            
            websiteItem.appendChild(websiteName);
            websiteItem.appendChild(controls);
            websiteList.appendChild(websiteItem);
        });
    }

    // Toggle website enabled state
    function toggleWebsite(domain) {
        chrome.storage.sync.get(['websites'], function(result) {
            const websites = result.websites || [];
            const updatedWebsites = websites.map(w => {
                if (w.domain === domain) {
                    return { ...w, enabled: !w.enabled };
                }
                return w;
            });
            
            chrome.storage.sync.set({ websites: updatedWebsites }, function() {
                renderWebsites(updatedWebsites);
                updateStatus(`Website ${updatedWebsites.find(w => w.domain === domain).enabled ? 'enabled' : 'disabled'}`);
            });
        });
    }

    // Delete website
    function deleteWebsite(domain) {
        chrome.storage.sync.get(['websites'], function(result) {
            const websites = result.websites || [];
            const updatedWebsites = websites.filter(w => w.domain !== domain);
            
            chrome.storage.sync.set({ websites: updatedWebsites }, function() {
                renderWebsites(updatedWebsites);
                updateStatus('Website deleted successfully');
            });
        });
    }

    // Validate domain format
    function isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        return domainRegex.test(domain);
    }

    // Reset timer button
    resetButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'resetTimer'}, function(response) {
                if (response && response.success) {
                    updateStatus('Timer reset successfully');
                } else {
                    updateStatus('Could not reset timer. Make sure you\'re on a monitored website.');
                }
            });
        });
    });

    function updateStatus(message) {
        statusDiv.textContent = message;
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 3000);
    }

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
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
                newTaskInput.focus(); // Focus back on input for next task
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

    // Focus on task input when popup opens
    newTaskInput.focus();

    // Add fullscreen button event listener
    fullscreenButton.addEventListener('click', () => {
        chrome.windows.create({
            url: 'fullscreen.html',
            type: 'popup',
            width: 800,
            height: 600
        });
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
            checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
            
            const titleText = document.createElement('span');
            titleText.className = 'task-title-text';
            titleText.textContent = task.title;
            
            taskTitle.appendChild(checkbox);
            taskTitle.appendChild(titleText);

            const taskControls = document.createElement('div');
            taskControls.className = 'task-controls';

            const addSubtaskButton = document.createElement('span');
            addSubtaskButton.className = 'material-icons';
            addSubtaskButton.textContent = 'add_task';
            addSubtaskButton.title = 'Add Subtask';
            addSubtaskButton.addEventListener('click', (e) => {
                e.stopPropagation();
                showAddSubtaskInput(task.id);
                if (!task.expanded) {
                    toggleTaskExpansion(task.id);
                }
            });

            const deleteButton = document.createElement('span');
            deleteButton.className = 'material-icons';
            deleteButton.textContent = 'delete';
            deleteButton.title = 'Delete Task';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            taskControls.appendChild(addSubtaskButton);
            taskControls.appendChild(deleteButton);

            taskHeader.appendChild(collapseButton);
            taskHeader.appendChild(taskTitle);
            taskHeader.appendChild(taskControls);

            const subtaskList = document.createElement('div');
            subtaskList.className = `subtask-list ${task.expanded ? 'expanded' : ''}`;
            
            // Render subtasks
            task.subtasks.forEach(subtask => {
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
                
                const titleText = document.createElement('span');
                titleText.className = 'task-title-text';
                titleText.textContent = subtask.title;
                
                subtaskTitle.appendChild(checkbox);
                subtaskTitle.appendChild(titleText);

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

    // Show add subtask input
    function showAddSubtaskInput(taskId) {
        // Remove any existing subtask input
        const existingInputs = document.querySelectorAll('.add-subtask');
        existingInputs.forEach(input => input.remove());

        const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
        const subtaskList = taskItem.querySelector('.subtask-list');
        
        const addSubtaskDiv = document.createElement('div');
        addSubtaskDiv.className = 'add-subtask';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter subtask';
        
        const addButton = document.createElement('button');
        addButton.className = 'button';
        addButton.innerHTML = '<span class="material-icons">add</span> Add';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'delete-button';
        cancelButton.innerHTML = '<span class="material-icons">close</span>';
        
        addButton.addEventListener('click', () => {
            const title = input.value.trim();
            if (title) {
                addSubtask(taskId, title);
                addSubtaskDiv.remove();
            }
        });
        
        cancelButton.addEventListener('click', () => {
            addSubtaskDiv.remove();
        });
        
        addSubtaskDiv.appendChild(input);
        addSubtaskDiv.appendChild(addButton);
        addSubtaskDiv.appendChild(cancelButton);
        subtaskList.appendChild(addSubtaskDiv);
        input.focus();
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
                        expanded: true // Automatically expand the task when adding a subtask
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
}); 