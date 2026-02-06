/**
 * Dynamic Calendar for ScubaLife
 * 
 * This script automatically generates the calendar from js/events-data.js
 * No need to edit HTML - just update the events-data.js file!
 * 
 * Features:
 * - Auto-generates month tabs (max 8 visible)
 * - Shows upcoming events first, then past events
 * - Latvian month names
 * - Responsive design
 */

(function() {
    'use strict';

    // Latvian month names
    const LATVIAN_MONTHS = {
        0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'Mai', 5: 'Jūn',
        6: 'Jūl', 7: 'Aug', 8: 'Sep', 9: 'Okt', 10: 'Nov', 11: 'Dec'
    };

    const MAX_TABS = 8;

    /**
     * Format date as DD.MM.YYYY
     */
    function formatDate(dateStr) {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }

    /**
     * Get month-year key from date string (e.g., "2026-07")
     */
    function getMonthKey(dateStr) {
        return dateStr.substring(0, 7);
    }

    /**
     * Format month key to Latvian display (e.g., "Jūl 2026")
     */
    function formatMonthTab(monthKey) {
        const [year, month] = monthKey.split('-');
        const monthName = LATVIAN_MONTHS[parseInt(month) - 1];
        return `${monthName} ${year}`;
    }

    /**
     * Check if event is in the past
     */
    function isEventPast(event) {
        const endDate = new Date(event.dateEnd);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return endDate < today;
    }

    /**
     * Group events by their start month
     */
    function groupEventsByMonth(events) {
        const groups = {};
        
        events.forEach(event => {
            if (!event.active) return;
            
            const monthKey = getMonthKey(event.dateStart);
            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(event);
        });

        return groups;
    }

    /**
     * Sort month keys - from latest to oldest (most recent first)
     */
    function sortMonthKeys(monthKeys) {
        return monthKeys.sort().reverse();
    }

    /**
     * Create HTML for a single event card
     */
    function createEventCard(event) {
        const dateDisplay = `${formatDate(event.dateStart)} - ${formatDate(event.dateEnd)}`;
        const isPast = isEventPast(event);
        
        let buttonHtml = '';
        if (event.documentUrl) {
            buttonHtml = `
                <div class="accent-button button">
                    <a target="_blank" href="${event.documentUrl}">Uzzināt vairāk</a>
                </div>`;
        }

        return `
            <li>
                <div class="item${isPast ? ' past-event' : ''}">
                    <img src="${event.image}" alt="${event.title}">
                    <div class="text-content">
                        <h4>${event.title}</h4>
                        <span>${dateDisplay}</span>
                        ${buttonHtml}
                    </div>
                </div>
            </li>`;
    }

    /**
     * Create the entire calendar HTML
     */
    function createCalendarHtml(eventGroups, sortedMonthKeys) {
        // Limit to MAX_TABS
        const visibleMonths = sortedMonthKeys.slice(0, MAX_TABS);
        
        // Create tab links
        const tabLinks = visibleMonths.map((monthKey, index) => {
            const tabId = `tab-${monthKey.replace('-', '')}`;
            return `<li><a href="#${tabId}"${index === 0 ? ' class="active"' : ''}>${formatMonthTab(monthKey)}</a></li>`;
        }).join('\n                        ');

        // Create tab content
        const tabContent = visibleMonths.map((monthKey, index) => {
            const tabId = `tab-${monthKey.replace('-', '')}`;
            const events = eventGroups[monthKey];
            const eventCards = events.map(e => createEventCard(e)).join('');
            const displayStyle = index === 0 ? 'display: block;' : 'display: none;';
            
            return `
                        <div id="${tabId}" style="${displayStyle}">
                            <ul>
                                ${eventCards}
                            </ul>
                        </div>`;
        }).join('');

        return `
            <div class="tabs-content">
                <div class="wrapper">
                    <ul class="tabs clearfix" data-tabgroup="calendar-tab-group">
                        ${tabLinks}
                    </ul>
                    <section id="calendar-tab-group" class="tabgroup">
                        ${tabContent}
                    </section>
                </div>
            </div>`;
    }

    /**
     * Initialize tab functionality for dynamically created tabs
     */
    function initTabs() {
        const tabLinks = document.querySelectorAll('#calendar-container .tabs a');
        const tabGroup = document.getElementById('calendar-tab-group');
        
        if (!tabGroup) return;

        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links
                tabLinks.forEach(l => l.classList.remove('active'));
                
                // Add active to clicked link
                this.classList.add('active');
                
                // Hide all tab content
                const allTabs = tabGroup.querySelectorAll(':scope > div');
                allTabs.forEach(tab => tab.style.display = 'none');
                
                // Show selected tab
                const targetId = this.getAttribute('href').substring(1);
                const targetTab = document.getElementById(targetId);
                if (targetTab) {
                    targetTab.style.display = 'block';
                }
            });
        });
    }

    /**
     * Render the calendar with events data
     */
    function renderCalendar(events) {
        const container = document.getElementById('calendar-container');
        if (!container) {
            console.error('Calendar container not found');
            return;
        }

        if (!events || events.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">Nav plānotu pasākumu</p>';
            return;
        }

        // Group and sort events
        const groups = groupEventsByMonth(events);
        const sortedKeys = sortMonthKeys(Object.keys(groups));

        if (sortedKeys.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">Nav plānotu pasākumu</p>';
            return;
        }

        // Render calendar
        container.innerHTML = createCalendarHtml(groups, sortedKeys);
        
        // Initialize tabs
        initTabs();
    }

    /**
     * Load and render calendar
     */
    function loadCalendar() {
        const container = document.getElementById('calendar-container');
        if (!container) return;

        // Use events from the global variable (loaded from events-data.js)
        if (typeof window.SCUBA_EVENTS !== 'undefined' && Array.isArray(window.SCUBA_EVENTS)) {
            renderCalendar(window.SCUBA_EVENTS);
        } else {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Neizdevās ielādēt kalendāru - pārbaudi events-data.js</p>';
            console.error('SCUBA_EVENTS not found. Make sure events-data.js is loaded before calendar.js');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCalendar);
    } else {
        loadCalendar();
    }

})();
