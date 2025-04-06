// Listen for installation
chrome.runtime.onInstalled.addListener(function() {
    console.log('Extension installed');
});

// Example of a background task
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getData") {
        // Handle the request
        sendResponse({data: "Some data from background"});
    }
    return true; // Required for async response
});

// Initialize badge with default values
chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
chrome.action.setBadgeText({ text: '' });

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge') {
        const { timeSpent, timeLimit } = request;
        const remainingTime = Math.max(0, timeLimit - timeSpent);
        
        // Update badge text with remaining time
        chrome.action.setBadgeText({ 
            text: remainingTime.toString() 
        });
        
        // Calculate progress percentage
        const progress = (timeSpent / timeLimit) * 100;
        
        // Update badge color based on progress
        let color;
        if (progress < 50) {
            color = '#4CAF50'; // Green
        } else if (progress < 75) {
            color = '#FFC107'; // Yellow
        } else {
            color = '#F44336'; // Red
        }
        
        chrome.action.setBadgeBackgroundColor({ color: color });
    }
    
    if (request.action === 'clearBadge') {
        chrome.action.setBadgeText({ text: '' });
    }
    
    return true;
}); 