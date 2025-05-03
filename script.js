// 4SH Streak Tracker - GitHub Pages Version
// Self-contained version for offline use with local storage only

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currentStreakEl = document.getElementById('current-streak');
    const bestStreakEl = document.getElementById('best-streak');
    const startDateEl = document.getElementById('start-date');
    const trackButton = document.getElementById('track-button');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    // Set up local data for display
    let streakData = getLocalStreakData();
    
    // Check if streak should be broken due to passing midnight IST
    checkStreakBreak();
    
    updateUI();
    
    // Event Listeners
    trackButton.addEventListener('click', trackToday);
    
    // Reset functionality
    const resetButton = document.getElementById('reset-button');
    const resetModal = document.getElementById('reset-modal');
    const confirmResetButton = document.getElementById('confirm-reset');
    const cancelResetButton = document.getElementById('cancel-reset');
    
    resetButton.addEventListener('click', () => {
        resetModal.classList.remove('hidden');
    });
    
    cancelResetButton.addEventListener('click', () => {
        resetModal.classList.add('hidden');
    });
    
    confirmResetButton.addEventListener('click', () => {
        // Reset streak data
        streakData = {
            currentStreak: 0,
            bestStreak: 0,
            lastTracked: null,
            startDate: null,
            lastUpdated: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('streakData', JSON.stringify(streakData));
        
        // Update UI
        updateUI();
        
        // Hide modal and show success message
        resetModal.classList.add('hidden');
        showToast('Streak has been reset.');
    });
    
    // Load data from localStorage
    function getLocalStreakData() {
        const defaultData = {
            currentStreak: 0,
            bestStreak: 0,
            lastTracked: null,
            startDate: null,
            lastUpdated: new Date().toISOString()
        };

        const savedData = localStorage.getItem('streakData');
        if (!savedData) return defaultData;

        try {
            return JSON.parse(savedData);
        } catch (error) {
            console.error('Error parsing streak data:', error);
            return defaultData;
        }
    }

    // Save streak data to localStorage
    function saveStreakData() {
        // Update timestamp
        streakData.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('streakData', JSON.stringify(streakData));
    }

    // Update the UI with current streak data
    function updateUI() {
        currentStreakEl.textContent = streakData.currentStreak;
        currentStreakEl.setAttribute('data-value', streakData.currentStreak);
        bestStreakEl.textContent = streakData.bestStreak;
        startDateEl.textContent = streakData.startDate ? formatDate(streakData.startDate) : '-';

        // Update button state
        const hasTrackedToday = hasTrackedForToday();
        trackButton.textContent = hasTrackedToday ? 'Already Tracked Today' : 'Track Today';
        trackButton.disabled = hasTrackedToday;
    }

    // Track today's progress
    function trackToday() {
        const today = getTodayDate();
        const hasContinuity = checkStreakContinuity(streakData.lastTracked);

        // Check if already tracked today
        if (hasTrackedForToday()) {
            showToast('You already tracked your progress today!');
            return;
        }

        // Update streak count
        if (!hasContinuity) {
            // Reset streak if there's a gap
            streakData.currentStreak = 1;
            streakData.startDate = today;
        } else {
            // Increment streak for continuous tracking
            streakData.currentStreak += 1;
            
            // Set start date if this is the first tracking
            if (!streakData.startDate) {
                streakData.startDate = today;
            }
        }

        // Update best streak if current is higher
        if (streakData.currentStreak > streakData.bestStreak) {
            streakData.bestStreak = streakData.currentStreak;
        }

        // Update last tracked date
        streakData.lastTracked = today;

        // Save data and update UI
        saveStreakData();
        updateUI();

        // Show success message
        showToast(getMotivationMessage(streakData.currentStreak));
    }

    // Get today's date in YYYY-MM-DD format in Indian Standard Time (IST)
    function getTodayDate() {
        // Create a date in local time
        const date = new Date();
        
        // Convert to IST (UTC+5:30)
        const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
        
        // Format as YYYY-MM-DD
        const year = istTime.getUTCFullYear();
        const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(istTime.getUTCDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`; // YYYY-MM-DD format in IST
    }

    // Check if already tracked today
    function hasTrackedForToday() {
        return streakData.lastTracked === getTodayDate();
    }

    // Check if previous tracking was yesterday (no gap) using IST time
    function checkStreakContinuity(lastTracked) {
        if (!lastTracked) return false;

        // Create a date in local time
        const now = new Date();
        
        // Convert to IST (UTC+5:30)
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        
        // Create yesterday in IST
        const yesterdayIST = new Date(istTime);
        yesterdayIST.setUTCDate(istTime.getUTCDate() - 1);
        
        // Format yesterday as YYYY-MM-DD
        const year = yesterdayIST.getUTCFullYear();
        const month = String(yesterdayIST.getUTCMonth() + 1).padStart(2, '0');
        const day = String(yesterdayIST.getUTCDate()).padStart(2, '0');
        
        const yesterdayStr = `${year}-${month}-${day}`;
        
        return lastTracked === yesterdayStr;
    }

    // Check if streak should be broken because the user didn't track before midnight IST
    function checkStreakBreak() {
        if (!streakData.lastTracked) return; // No streak to break yet
        
        const today = getTodayDate();
        const yesterday = getYesterdayDate();
        
        // If last tracked was not yesterday or today, and we have a streak, then break it
        if (streakData.lastTracked !== yesterday && streakData.lastTracked !== today && streakData.currentStreak > 0) {
            // Save the best streak if current is higher
            if (streakData.currentStreak > streakData.bestStreak) {
                streakData.bestStreak = streakData.currentStreak;
            }
            
            // Reset the streak
            streakData.currentStreak = 0;
            streakData.startDate = null;
            
            // Save to localStorage
            saveStreakData();
            
            // Show a notification about the broken streak
            setTimeout(() => {
                showToast('Your streak was broken because you missed tracking before midnight IST.');
            }, 1000);
        }
    }
    
    // Get yesterday's date in YYYY-MM-DD format in IST
    function getYesterdayDate() {
        // Create a date in local time
        const now = new Date();
        
        // Convert to IST (UTC+5:30)
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        
        // Create yesterday in IST
        const yesterdayIST = new Date(istTime);
        yesterdayIST.setUTCDate(istTime.getUTCDate() - 1);
        
        // Format yesterday as YYYY-MM-DD
        const year = yesterdayIST.getUTCFullYear();
        const month = String(yesterdayIST.getUTCMonth() + 1).padStart(2, '0');
        const day = String(yesterdayIST.getUTCDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    // Get a motivational message based on streak length
    function getMotivationMessage(streakDays) {
        const messages = [
            "Great job! Keep going!",
            "That's a day of progress!",
            "You've got this!",
            "Stay strong, keep going!",
            "One day at a time!",
            "Keep up the good work!",
            "You're building a better you!",
            "Consistency is key!",
            "Every day counts!",
            "You should be proud of yourself!"
        ];

        if (streakDays % 10 === 0) {
            return `Amazing! You've reached ${streakDays} days!`;
        } else if (streakDays % 5 === 0) {
            return `Excellent! ${streakDays} day streak!`;
        } else {
            return messages[Math.floor(Math.random() * messages.length)];
        }
    }

    // Show toast notification
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
});