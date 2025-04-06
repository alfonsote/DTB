let timer = null;
let timeSpent = 0;
let isBlocked = false;

// Create and style the blocking overlay
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
    `;
    
    const message = document.createElement('h1');
    message.textContent = "Time's up! You've spent too long on this site.";
    message.style.cssText = `
        font-size: 24px;
        margin-bottom: 20px;
    `;
    
    overlay.appendChild(message);

    // Add tasks section
    const tasksSection = document.createElement('div');
    tasksSection.style.cssText = `
        width: 80%;
        max-width: 600px;
        margin-top: 20px;
        text-align: left;
    `;

    const tasksTitle = document.createElement('h2');
    tasksTitle.textContent = 'Your Pending Tasks:';
    tasksTitle.style.cssText = `
        font-size: 20px;
        margin-bottom: 15px;
        color: #4CAF50;
    `;
    tasksSection.appendChild(tasksTitle);

    // Get and display tasks
    chrome.storage.sync.get(['tasks'], function(result) {
        const tasks = result.tasks || [];
        const pendingTasks = tasks.filter(task => !task.completed);

        if (pendingTasks.length === 0) {
            const noTasks = document.createElement('p');
            noTasks.textContent = 'No pending tasks. Great job!';
            noTasks.style.cssText = `
                font-style: italic;
                color: #888;
            `;
            tasksSection.appendChild(noTasks);
        } else {
            const tasksList = document.createElement('div');
            tasksList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;

            pendingTasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.style.cssText = `
                    background-color: rgba(255, 255, 255, 0.1);
                    padding: 10px;
                    border-radius: 4px;
                `;

                const taskHeader = document.createElement('div');
                taskHeader.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 5px;
                `;

                const taskTitle = document.createElement('span');
                taskTitle.textContent = task.title;
                taskTitle.style.cssText = `
                    font-size: 16px;
                    font-weight: bold;
                `;

                const taskTime = document.createElement('span');
                const creationDate = new Date(task.id);
                const timeDiff = Math.floor((Date.now() - task.id) / (1000 * 60 * 60 * 24));
                taskTime.textContent = `Created ${timeDiff} day${timeDiff !== 1 ? 's' : ''} ago`;
                taskTime.style.cssText = `
                    font-size: 12px;
                    color: #888;
                `;

                taskHeader.appendChild(taskTitle);
                taskHeader.appendChild(taskTime);
                taskItem.appendChild(taskHeader);

                // Add subtasks if any
                if (task.subtasks && task.subtasks.length > 0) {
                    const pendingSubtasks = task.subtasks.filter(subtask => !subtask.completed);
                    if (pendingSubtasks.length > 0) {
                        const subtaskList = document.createElement('div');
                        subtaskList.style.cssText = `
                            margin-left: 20px;
                            margin-top: 5px;
                        `;

                        pendingSubtasks.forEach(subtask => {
                            const subtaskItem = document.createElement('div');
                            subtaskItem.style.cssText = `
                                font-size: 14px;
                                color: #ddd;
                                margin-top: 5px;
                            `;
                            subtaskItem.textContent = `• ${subtask.title}`;
                            subtaskList.appendChild(subtaskItem);
                        });

                        taskItem.appendChild(subtaskList);
                    }
                }

                tasksList.appendChild(taskItem);
            });

            tasksSection.appendChild(tasksList);
        }
    });

    overlay.appendChild(tasksSection);
    return overlay;
}

// Start or resume the timer
function startTimer(timeLimit) {
    if (timer) return;
    
    timer = setInterval(() => {
        timeSpent++;
        
        // Send progress update to background script
        chrome.runtime.sendMessage({
            action: 'updateBadge',
            timeSpent: timeSpent,
            timeLimit: timeLimit
        });
        
        if (timeSpent >= timeLimit && !isBlocked) {
            blockPage();
        }
    }, 1000);
}

// Stop the timer
function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
        // Clear the badge when timer is stopped
        chrome.runtime.sendMessage({ action: 'clearBadge' });
    }
}

// Block the page
function blockPage() {
    isBlocked = true;
    stopTimer();
    
    // Pause all videos on the page
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        if (!video.paused) {
            video.pause();
        }
    });
    
    const overlay = createOverlay();
    document.body.appendChild(overlay);

    // Check if we should block all tabs with the same domain
    chrome.storage.sync.get(['blockAllTabs'], function(result) {
        if (result.blockAllTabs) {
            const currentDomain = window.location.hostname;
            
            // Find and block all tabs with the same domain
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(tab => {
                    try {
                        const tabUrl = new URL(tab.url);
                        if (tabUrl.hostname === currentDomain && tab.id !== chrome.runtime.id) {
                            chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                function: blockTab
                            });
                        }
                    } catch (e) {
                        // Skip invalid URLs
                    }
                });
            });
        }
    });
}

// Function to block a specific tab
function blockTab() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
    `;
    
    const message = document.createElement('h1');
    message.textContent = "Time's up! You've spent too long on this site.";
    message.style.cssText = `
        font-size: 24px;
        margin-bottom: 20px;
    `;
    
    overlay.appendChild(message);
    document.body.appendChild(overlay);

    // Pause all videos on the page
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        if (!video.paused) {
            video.pause();
        }
    });
}

// Check if current website is monitored
function isWebsiteMonitored(domain) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['websites', 'enabled'], function(result) {
            if (!result.enabled) {
                resolve(false);
                return;
            }
            
            const websites = result.websites || [];
            const website = websites.find(w => domain.includes(w.domain));
            resolve(website ? website.enabled : false);
        });
    });
}

// Initialize timer when page loads
chrome.storage.sync.get(['enabled', 'timeLimit', 'websites'], async function(result) {
    if (result.enabled) {
        const domain = window.location.hostname;
        const isMonitored = await isWebsiteMonitored(domain);
        console.log('Domain:', domain, 'Is monitored:', isMonitored);
        
        if (isMonitored) {
            timeSpent = 0;
            startTimer(result.timeLimit || 30);
        }
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.action === 'resetTimer') {
        const domain = window.location.hostname;
        const isMonitored = await isWebsiteMonitored(domain);
        
        if (isMonitored) {
            timeSpent = 0;
            if (isBlocked) {
                const overlay = document.querySelector('div[style*="position: fixed; top: 0; left: 0; width: 100%; height: 100%;"]');
                if (overlay) {
                    overlay.remove();
                }
                isBlocked = false;
            }
            chrome.storage.sync.get(['timeLimit'], function(result) {
                startTimer(result.timeLimit || 30);
            });
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, message: 'Website not monitored' });
        }
    }
    return true;
});

// Monitor visibility changes
document.addEventListener('visibilitychange', async function() {
    if (document.hidden) {
        stopTimer();
    } else {
        const domain = window.location.hostname;
        const isMonitored = await isWebsiteMonitored(domain);
        
        if (isMonitored) {
            chrome.storage.sync.get(['timeLimit'], function(result) {
                startTimer(result.timeLimit || 30);
            });
        }
    }
}); 