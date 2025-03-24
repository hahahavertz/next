// Sample data structure for future use
const sampleData = [
    { route: 'B52', station: 'Main Street', arrival: '5 min', nextArrival: '12 min', type: 'bus' },
    { route: 'A12', station: 'Central Park', arrival: '7 min', nextArrival: '12 min', type: 'train' },
    { route: 'T4', station: 'Union Square', arrival: '10 min', nextArrival: '18 min', type: 'train' },
    { route: 'B15', station: 'Downtown', arrival: '2 min', nextArrival: '15 min', type: 'bus' },
    { route: 'T8', station: 'Harbor Station', arrival: '15 min', nextArrival: '25 min', type: 'train' },
    { route: 'C30', station: 'Airport', arrival: '12 min', nextArrival: '24 min', type: 'bus' },
    { route: 'E5', station: 'Westside', arrival: '8 min', nextArrival: '20 min', type: 'train' },
    { route: 'R1', station: 'Eastbound', arrival: '20 min', nextArrival: '35 min', type: 'bus' },
    { route: 'M25', station: 'North Station', arrival: '3 min', nextArrival: '16 min', type: 'bus' },
    { route: 'B42', station: 'South Terminal', arrival: '18 min', nextArrival: '28 min', type: 'train' }
];

// Helper function to calculate minutes until arrival and format time display
function formatArrivalTime(etaTime) {
    const now = new Date();
    
    // Calculate time difference in milliseconds
    const diffMs = etaTime - now;
    
    // Calculate seconds difference for more precise handling of "now" vs "1 min"
    const diffSeconds = Math.floor(diffMs / 1000);
    
    // Calculate minutes difference (rounding up) for display
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    
    // Format the full time display
    const timeString = etaTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    });
    
    // Determine the minutes text to display
    let minutesText;
    if (diffSeconds < 60) {
        // Less than 60 seconds remaining - show "now"
        minutesText = 'now';
    } else if (diffSeconds < 120) {
        // Between 60-119 seconds - show "1 min"
        minutesText = '1 min';
    } else {
        // 2 minutes or more - show the rounded up minute value
        minutesText = `${diffMinutes} mins`;
    }
    
    return {
        minutes: diffSeconds <= 0 ? 'now' : minutesText,
        fullTime: timeString
    };
}

// Function to create time element with minutes and full time
function createTimeElement(etaTime, className) {
    const timeCell = document.createElement('td');
    timeCell.className = `time ${className || ''}`;
    
    const timeInfo = formatArrivalTime(etaTime);
    
    const minutesSpan = document.createElement('span');
    minutesSpan.className = 'minutes';
    minutesSpan.textContent = timeInfo.minutes;
    
    const fullTimeSpan = document.createElement('span');
    fullTimeSpan.className = 'full-time';
    fullTimeSpan.textContent = timeInfo.fullTime;
    
    timeCell.appendChild(minutesSpan);
    timeCell.appendChild(fullTimeSpan);
    
    return timeCell;
}

// Function to update time cell with minutes and full time
function updateTimeCell(cell, etaTime) {
    const timeInfo = formatArrivalTime(etaTime);
    
    // Clear existing content
    cell.innerHTML = '';
    
    const minutesSpan = document.createElement('span');
    minutesSpan.className = 'minutes';
    minutesSpan.textContent = timeInfo.minutes;
    
    // Add 'now-text' class for immediate arrivals
    if (timeInfo.minutes === 'now') {
        minutesSpan.classList.add('now-text');
    }
    
    const fullTimeSpan = document.createElement('span');
    fullTimeSpan.className = 'full-time';
    fullTimeSpan.textContent = timeInfo.fullTime;
    
    cell.appendChild(minutesSpan);
    cell.appendChild(fullTimeSpan);
}

// Function to fetch bus data
async function fetchBusData() {
    try {
        // Fetch real-time data from the API for 967 (row 4)
        const apiUrl = 'https://rt.data.gov.hk/v2/transport/citybus/eta/CTB/003773/967';
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Process the data regardless of how many entries we have
        if (data && data.data && data.data.length > 0) {
            // Process the data for the first entry
            const firstBusData = data.data[0];
            const firstEtaTime = new Date(firstBusData.eta);
            
            // Use second entry if available, otherwise use n/a
            let secondEtaTime;
            if (data.data.length > 1) {
                secondEtaTime = new Date(data.data[1].eta);
            } else {
                // Create a fallback date (it won't be displayed, but needed for the function)
                secondEtaTime = new Date(firstEtaTime);
                secondEtaTime.setMinutes(secondEtaTime.getMinutes() + 30);
            }
            
            // Update 967 row (now row 4) with the fetched data
            update967Row({
                route: firstBusData.route,
                station: '慧景軒', // Using the requested station name
                firstEtaTime: firstEtaTime,
                secondEtaTime: secondEtaTime,
                hasSecondEta: data.data.length > 1, // Flag to indicate if second ETA exists
                type: 'bus'
            });
        } else {
            // No data received
            update967RowNoData();
        }
        
        // Update last updated time
        const now = new Date();
        const updateTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('last-update').textContent = updateTimeString;
        
    } catch (error) {
        console.error('Error fetching bus data:', error);
        // In case of error, show n/a
        update967RowNoData();
    }
}

// Helper function when no data is available for first row
function updateFirstRowNoData() {
    const timeCell = document.querySelector('.arrivals-table tbody tr:first-child td:nth-child(2)');
    const nextTimeCell = document.querySelector('.arrivals-table tbody tr:first-child td:nth-child(3)');
    
    if (timeCell && nextTimeCell) {
        timeCell.innerHTML = '<span class="minutes na-text">n/a</span>';
        nextTimeCell.innerHTML = '<span class="minutes na-text">n/a</span>';
    }
}

// Function to update the 967 row (row 4)
function update967Row(data) {
    const row = document.querySelector('.arrivals-table tbody tr:nth-child(4)');
    if (row) {
        const routeCell = row.querySelector('td.route-cell');
        const timeCell = row.querySelector('td:nth-child(2)');
        const nextTimeCell = row.querySelector('td:nth-child(3)');
        
        // Update the cells with new data
        if (routeCell && timeCell && nextTimeCell) {
            const routeNumber = routeCell.querySelector('.route-number');
            const stationName = routeCell.querySelector('.station-name');
            
            if (routeNumber && stationName) {
                routeNumber.textContent = data.route;
                stationName.textContent = data.station;
            }
            
            // Update first arrival time
            updateTimeCell(timeCell, data.firstEtaTime);
            
            // Update second arrival time or show n/a
            if (data.hasSecondEta) {
                updateTimeCell(nextTimeCell, data.secondEtaTime);
            } else {
                nextTimeCell.innerHTML = '<span class="minutes">n/a</span>';
            }
            
            nextTimeCell.classList.add('next-arrival');
        }
    }
}

// Helper function when no data is available for 967 row
function update967RowNoData() {
    const row = document.querySelector('.arrivals-table tbody tr:nth-child(4)');
    if (row) {
        const timeCell = row.querySelector('td:nth-child(2)');
        const nextTimeCell = row.querySelector('td:nth-child(3)');
        
        if (timeCell && nextTimeCell) {
            timeCell.innerHTML = '<span class="minutes na-text">n/a</span>';
            nextTimeCell.innerHTML = '<span class="minutes na-text">n/a</span>';
        }
    }
}

// Function to update the table with new data
function updateTable(data) {
    const tbody = document.querySelector('.arrivals-table tbody');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        const routeCell = document.createElement('td');
        const routeSpan = document.createElement('span');
        routeSpan.className = `route ${item.type}-icon`;
        routeSpan.textContent = item.route;
        routeCell.appendChild(routeSpan);
        
        const stationCell = document.createElement('td');
        stationCell.textContent = item.station;
        
        const arrivalCell = document.createElement('td');
        arrivalCell.className = 'time';
        arrivalCell.textContent = item.arrival;
        
        const nextArrivalCell = document.createElement('td');
        nextArrivalCell.className = 'time next-arrival';
        nextArrivalCell.textContent = item.nextArrival;
        
        row.appendChild(routeCell);
        row.appendChild(stationCell);
        row.appendChild(arrivalCell);
        row.appendChild(nextArrivalCell);
        
        tbody.appendChild(row);
    });
    
    // Update last updated time
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('last-update').textContent = timeString;
}

// Function to fetch multiple bus data
async function fetchMultipleBusData() {
    try {
        // Fetch data for LRT routes 705 and 706 (now rows 1 and 2)
        const apiLrtUrl = 'https://rt.data.gov.hk/v1/transport/mtr/lrt/getSchedule?station_id=520';
        const responseLrt = await fetch(apiLrtUrl);
        if (responseLrt.ok) {
            const dataLrt = await responseLrt.json();
            
            if (dataLrt && dataLrt.platform_list) {
                // Process route 705
                const data705 = [];
                
                // Find items with route_no 705
                for (const platform of dataLrt.platform_list) {
                    for (const train of platform.route_list) {
                        if (train.route_no === "705") {
                            data705.push(train);
                        }
                    }
                }
                
                // Parse time for calculations if needed
                function parseTimeToDate(timeStr) {
                    // Create a reference to current time
                    const now = new Date();
                    const result = new Date(now);
                    
                    // Handle empty or invalid inputs
                    if (!timeStr || timeStr === '--' || timeStr === 'n/a') {
                        // For display purposes only - not actual arrival time
                        result.setMinutes(result.getMinutes() + 60);
                        return result;
                    }
                    
                    // Handle special cases for immediate arrivals
                    if (timeStr === 'Arriving' || timeStr === '-') {
                        // Arriving now (less than 60 seconds)
                        result.setSeconds(result.getSeconds() + 30);
                        return result;
                    }
                    
                    // Handle minute-based formats like "1 min" or "5 mins"
                    if (timeStr.includes('min')) {
                        const minuteMatch = timeStr.match(/(\d+)\s*min/);
                        if (minuteMatch && minuteMatch[1]) {
                            const minutes = parseInt(minuteMatch[1], 10);
                            
                            if (!isNaN(minutes)) {
                                if (minutes === 1) {
                                    // "1 min" should represent between 60-119 seconds
                                    // Using 90 seconds (1.5 minutes) ensures it displays correctly
                                    result.setSeconds(result.getSeconds() + 90);
                                } else {
                                    // For 2+ minutes, add the exact minute count
                                    result.setMinutes(result.getMinutes() + minutes);
                                }
                                return result;
                            }
                        }
                    }
                    
                    // Handle time formats like "12:34" or "12:34:56"
                    const timeMatch = timeStr.match(/(\d+):(\d+)(?::(\d+))?/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1], 10);
                        const minutes = parseInt(timeMatch[2], 10);
                        const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
                        
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            result.setHours(hours, minutes, seconds, 0);
                            
                            // If the resulting time is in the past, add 24 hours
                            if (result < now) {
                                result.setDate(result.getDate() + 1);
                            }
                            
                            return result;
                        }
                    }
                    
                    // For any unhandled format, return the current time plus 5 minutes
                    // as a fallback (this shouldn't happen with proper data)
                    console.warn(`Unrecognized time format: "${timeStr}", using fallback value`);
                    result.setMinutes(result.getMinutes() + 5);
                    return result;
                }
                
                // Fix display strings: replace "Arriving" with "1 min"
                data705.forEach(train => {
                    if (train.time_en === "Arriving") {
                        train.time_en = "1 min";
                    }
                });
                
                // Get time data for route 705
                const firstTimeStr = data705.length > 0 ? data705[0].time_en : 'n/a';
                const secondTimeStr = data705.length > 1 ? data705[1].time_en : 'n/a';
                
                // Create date objects for calculations
                const firstEta = data705.length > 0 ? parseTimeToDate(data705[0].time_en) : new Date();
                const secondEta = data705.length > 1 ? parseTimeToDate(data705[1].time_en) : new Date();
                
                // Update row for route 705 (now row 1)
                updateFirstRow({
                    route: '705',
                    station: '天秀',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: data705.length > 1,
                    type: 'train'
                });
                
                // Process route 706
                const data706 = [];
                
                // Find items with route_no 706
                for (const platform of dataLrt.platform_list) {
                    for (const train of platform.route_list) {
                        if (train.route_no === "706") {
                            data706.push(train);
                        }
                    }
                }
                
                // Fix display strings: replace "Arriving" with "1 min"
                data706.forEach(train => {
                    if (train.time_en === "Arriving") {
                        train.time_en = "1 min";
                    }
                });
                
                // Get time data for route 706
                const firstTimeStr706 = data706.length > 0 ? data706[0].time_en : 'n/a';
                const secondTimeStr706 = data706.length > 1 ? data706[1].time_en : 'n/a';
                
                // Create date objects for calculations
                const firstEta706 = data706.length > 0 ? parseTimeToDate(data706[0].time_en) : new Date();
                const secondEta706 = data706.length > 1 ? parseTimeToDate(data706[1].time_en) : new Date();
                
                // Update row for route 706 (now row 2)
                updateLrtRowData(1, {
                    route: '706',
                    station: '天秀',
                    firstEtaTime: firstEta706,
                    secondEtaTime: secondEta706,
                    firstTimeStr: firstTimeStr706,
                    secondTimeStr: secondTimeStr706,
                    type: 'train'
                });
            } else {
                // No platform list available
                updateRowNoData(0); // For route 705
                updateRowNoData(1); // For route 706
            }
        } else {
            // API error
            updateRowNoData(0); // For route 705
            updateRowNoData(1); // For route 706
        }
        
        // Fetch data for K73 MTR bus route (now row 3)
        const apiK73Url = 'https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule';
        const responseK73 = await fetch(apiK73Url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                language: 'zh',
                routeName: 'K73'
            })
        });

        if (responseK73.ok) {
            try {
                const dataK73 = await responseK73.json();
                console.log("K73 raw API response:", dataK73);
                
                let foundK73Data = false;
                
                if (dataK73 && dataK73.busStop && Array.isArray(dataK73.busStop)) {
                    // Target is "天晴邨晴碧樓" / "Ching Pik House, Tin Ching Estate"
                    // with station ID K73-U040, direction O, sequence 4
                    const TARGET_STOP_ID = 'K73-U040';
                    
                    // Find stop with our target ID
                    let targetStop = dataK73.busStop.find(stop => stop.busStopId === TARGET_STOP_ID);
                    console.log("Found K73-U040 stop:", targetStop ? "yes" : "no");
                    
                    if (targetStop && targetStop.bus && Array.isArray(targetStop.bus)) {
                        // Filter for buses in the outbound direction (YLW = Yuen Long West)
                        // The API uses lineRef with suffix "K73_YLW" for this direction
                        const outboundBuses = targetStop.bus.filter(bus => 
                            bus.lineRef && (bus.lineRef.includes('YLW') || bus.direction === 'O')
                        );
                        
                        console.log("K73 outbound buses at U040:", outboundBuses);
                        
                        if (outboundBuses.length > 0) {
                            // Sort by departure time
                            const sortedBuses = [...outboundBuses].sort((a, b) => {
                                const timeA = parseInt(a.departureTimeInSecond, 10) || 999999;
                                const timeB = parseInt(b.departureTimeInSecond, 10) || 999999;
                                return timeA - timeB;
                            });
                            
                            // Log the sorted buses with their departure times
                            console.log("K73 sorted buses:", 
                                sortedBuses.map(bus => `${bus.departureTimeText} (${bus.departureTimeInSecond}s)`));
                            
                            // Current time reference
                            const now = new Date();
                            
                            // First bus
                            if (sortedBuses.length > 0) {
                                const firstDepartureSeconds = parseInt(sortedBuses[0].departureTimeInSecond, 10);
                                if (!isNaN(firstDepartureSeconds) && firstDepartureSeconds > 0) {
                                    // Create arrival time by adding seconds to current time
                                    const firstEtaTime = new Date(now);
                                    firstEtaTime.setSeconds(firstEtaTime.getSeconds() + firstDepartureSeconds);
                                    
                                    // Second bus if available
                                    let secondEtaTime = null;
                                    let hasSecondBus = false;
                                    
                                    if (sortedBuses.length > 1) {
                                        const secondDepartureSeconds = parseInt(sortedBuses[1].departureTimeInSecond, 10);
                                        if (!isNaN(secondDepartureSeconds) && secondDepartureSeconds > 0) {
                                            secondEtaTime = new Date(now);
                                            secondEtaTime.setSeconds(secondEtaTime.getSeconds() + secondDepartureSeconds);
                                            hasSecondBus = true;
                                        }
                                    }
                                    
                                    // Debug info (show both seconds and rounded-up minutes)
                                    console.log(`K73 first bus in ${firstDepartureSeconds}s = ${Math.ceil(firstDepartureSeconds/60)} min`);
                                    if (hasSecondBus) {
                                        const secondDepartureSeconds = parseInt(sortedBuses[1].departureTimeInSecond, 10);
                                        console.log(`K73 second bus in ${secondDepartureSeconds}s = ${Math.ceil(secondDepartureSeconds/60)} min`);
                                    }
                                    
                                    // Update K73 row (row index 2)
                                    updateRowData(2, {
                                        route: 'K73',
                                        station: '天晴邨晴碧樓',
                                        firstEtaTime: firstEtaTime,
                                        secondEtaTime: secondEtaTime,
                                        hasSecondEta: hasSecondBus,
                                        type: 'bus'
                                    });
                                    
                                    foundK73Data = true;
                                }
                            }
                        }
                    }
                }
                
                if (!foundK73Data) {
                    console.log("No valid K73 data found for K73-U040");
                    updateRowNoData(2);
                }
            } catch (error) {
                console.error('Error processing K73 data:', error);
                updateRowNoData(2);
            }
        } else {
            console.error('Failed to fetch K73 data, status:', responseK73.status);
            updateRowNoData(2);
        }
        
        // Fetch data for new 969 route (慧景軒) (now row 5)
        const api969HkUrl = 'https://rt.data.gov.hk/v2/transport/citybus/eta/CTB/003773/969';
        const response969Hk = await fetch(api969HkUrl);
        if (response969Hk.ok) {
            const data969Hk = await response969Hk.json();
            if (data969Hk && data969Hk.data && data969Hk.data.length > 0) {
                const firstEta = new Date(data969Hk.data[0].eta);
                
                // Use second entry if available
                let secondEta;
                let hasSecondEta = false;
                
                if (data969Hk.data.length > 1) {
                    secondEta = new Date(data969Hk.data[1].eta);
                    hasSecondEta = true;
                } else {
                    // Fallback date (won't be displayed)
                    secondEta = new Date(firstEta);
                    secondEta.setMinutes(secondEta.getMinutes() + 30);
                }
                
                updateRowData(4, {
                    route: '969',
                    station: '慧景軒',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(4);
            }
        } else {
            updateRowNoData(4);
        }
        
        // Fetch data for route 969 (晴彩樓) (now row 6)
        const api969Url = 'https://rt.data.gov.hk/v2/transport/citybus/eta/CTB/002059/969';
        const response969 = await fetch(api969Url);
        if (response969.ok) {
            const data969 = await response969.json();
            if (data969 && data969.data && data969.data.length > 0) {
                const firstEta = new Date(data969.data[0].eta);
                
                // Use second entry if available
                let secondEta;
                let hasSecondEta = false;
                
                if (data969.data.length > 1) {
                    secondEta = new Date(data969.data[1].eta);
                    hasSecondEta = true;
                } else {
                    // Fallback date (won't be displayed)
                    secondEta = new Date(firstEta);
                    secondEta.setMinutes(secondEta.getMinutes() + 30);
                }
                
                updateRowData(5, {
                    route: '969',
                    station: '晴彩樓',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(5);
            }
        } else {
            updateRowNoData(5);
        }
        
        // Fetch data for route 269M (now row 7)
        const api269Url = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/797CC0222B9EFBEF/269M/1';
        const response269 = await fetch(api269Url);
        if (response269.ok) {
            const data269 = await response269.json();
            if (data269 && data269.data && data269.data.length > 0) {
                const firstEta = new Date(data269.data[0].eta);
                
                // Use second entry if available
                let secondEta;
                let hasSecondEta = false;
                
                if (data269.data.length > 1) {
                    secondEta = new Date(data269.data[1].eta);
                    hasSecondEta = true;
                } else {
                    // Fallback date (won't be displayed)
                    secondEta = new Date(firstEta);
                    secondEta.setMinutes(secondEta.getMinutes() + 30);
                }
                
                updateRowData(6, {
                    route: '269M',
                    station: '晴碧樓',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(6);
            }
        } else {
            updateRowNoData(6);
        }
        
        // Fetch data for route 265M (now row 8)
        const api265Url = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/FE801C732EC6EA42/265M/1';
        const response265 = await fetch(api265Url);
        if (response265.ok) {
            const data265 = await response265.json();
            if (data265 && data265.data && data265.data.length > 0) {
                const firstEta = new Date(data265.data[0].eta);
                
                // Use second entry if available
                let secondEta;
                let hasSecondEta = false;
                
                if (data265.data.length > 1) {
                    secondEta = new Date(data265.data[1].eta);
                    hasSecondEta = true;
                } else {
                    // Fallback date (won't be displayed)
                    secondEta = new Date(firstEta);
                    secondEta.setMinutes(secondEta.getMinutes() + 30);
                }
                
                updateRowData(7, {
                    route: '265M',
                    station: '晴彩樓',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(7);
            }
        } else {
            updateRowNoData(7);
        }
        
        // Fetch data for route 269C (now row 9)
        const api269CUrl = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/7BB395B6FE66E102/269C/1';
        const response269C = await fetch(api269CUrl);
        if (response269C.ok) {
            const data269C = await response269C.json();
            if (data269C && data269C.data && data269C.data.length > 0) {
                const firstEta = new Date(data269C.data[0].eta);
                
                // Use second entry if available
                let secondEta;
                let hasSecondEta = false;
                
                if (data269C.data.length > 1) {
                    secondEta = new Date(data269C.data[1].eta);
                    hasSecondEta = true;
                } else {
                    // Fallback date (won't be displayed)
                    secondEta = new Date(firstEta);
                    secondEta.setMinutes(secondEta.getMinutes() + 30);
                }
                
                updateRowData(8, {
                    route: '269C',
                    station: '麗湖居',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(8);
            }
        } else {
            updateRowNoData(8);
        }
        
        // Fetch data for route 276B (慧景軒) (now row 10)
        const api276BUrl = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/A6C169DA579FC45B/276B/1';
        const response276B = await fetch(api276BUrl);
        if (response276B.ok) {
            const data276B = await response276B.json();
            if (data276B && data276B.data && data276B.data.length > 0) {
                const firstEta = new Date(data276B.data[0].eta);
                
                // Use second entry if available
                let secondEta;
                let hasSecondEta = false;
                
                if (data276B.data.length > 1) {
                    secondEta = new Date(data276B.data[1].eta);
                    hasSecondEta = true;
                } else {
                    // Fallback date (won't be displayed)
                    secondEta = new Date(firstEta);
                    secondEta.setMinutes(secondEta.getMinutes() + 30);
                }
                
                updateRowData(9, {
                    route: '276B',
                    station: '慧景軒',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(9);
            }
        } else {
            updateRowNoData(9);
        }
        
        // Fetch data for route 276B (彩園總站) with destination filter (now row 11)
        const api276B2Url = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/26A1D2969A15C3AF/276B/1';
        const response276B2 = await fetch(api276B2Url);
        if (response276B2.ok) {
            const data276B2 = await response276B2.json();
            
            // Filter for "天富" destination
            if (data276B2 && data276B2.data) {
                const filteredData = data276B2.data.filter(item => item.dest_tc === '天富');
                
                if (filteredData.length > 0) {
                    const firstEta = new Date(filteredData[0].eta);
                    
                    // Use second entry if available
                    let secondEta;
                    let hasSecondEta = false;
                    
                    if (filteredData.length > 1) {
                        secondEta = new Date(filteredData[1].eta);
                        hasSecondEta = true;
                    } else {
                        // Fallback date (won't be displayed)
                        secondEta = new Date(firstEta);
                        secondEta.setMinutes(secondEta.getMinutes() + 30);
                    }
                    
                    updateRowData(10, {
                        route: '276B',
                        station: '彩園總站',
                        firstEtaTime: firstEta,
                        secondEtaTime: secondEta,
                        hasSecondEta: hasSecondEta,
                        type: 'bus'
                    });
                } else {
                    // No "天富" destinations found
                    updateRowNoData(10);
                }
            } else {
                updateRowNoData(10);
            }
        } else {
            updateRowNoData(10);
        }
        
        // Fetch data for route 265B (now row 12)
        const api265BUrl = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/FE801C732EC6EA42/265B/1';
        const response265B = await fetch(api265BUrl);
        if (response265B.ok) {
            const data265B = await response265B.json();
            if (data265B && data265B.data && data265B.data.length > 0) {
                const firstEta = new Date(data265B.data[0].eta);
                
                // Use second entry if available
                let secondEta;
                let hasSecondEta = false;
                
                if (data265B.data.length > 1) {
                    secondEta = new Date(data265B.data[1].eta);
                    hasSecondEta = true;
                } else {
                    // Fallback date (won't be displayed)
                    secondEta = new Date(firstEta);
                    secondEta.setMinutes(secondEta.getMinutes() + 30);
                }
                
                updateRowData(11, {
                    route: '265B',
                    station: '晴彩樓',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(11);
            }
        } else {
            updateRowNoData(11);
        }
        
        // Fetch data for route 69 (now row 13)
        const api69Url = 'https://data.etabus.gov.hk/v1/transport/kmb/eta/79C0E2525F4B50FF/69/1';
        const response69 = await fetch(api69Url);
        if (response69.ok) {
            const data69 = await response69.json();
            if (data69 && data69.data && data69.data.length > 0) {
                const firstEta = new Date(data69.data[0].eta);
                
                // Use second entry if available
                let secondEta;
                let hasSecondEta = false;
                
                if (data69.data.length > 1) {
                    secondEta = new Date(data69.data[1].eta);
                    hasSecondEta = true;
                } else {
                    // Fallback date (won't be displayed)
                    secondEta = new Date(firstEta);
                    secondEta.setMinutes(secondEta.getMinutes() + 30);
                }
                
                updateRowData(12, {
                    route: '69',
                    station: '濕地公園路',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(12);
            }
        } else {
            updateRowNoData(12);
        }
        
        // Update last updated time
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
    } catch (error) {
        console.error('Error fetching bus data:', error);
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
        // Mark all rows as no data when there's an error
        for (let i = 0; i < 13; i++) {
            updateRowNoData(i);
        }
    }
}

// Helper function for when no data is available for a specific row
function updateRowNoData(rowIndex) {
    const rows = document.querySelector('.arrivals-table').querySelectorAll('tr');
    if (rowIndex < rows.length) {
        const row = rows[rowIndex];
        
        // Update arrival times to show no data
        const minutesElements = row.querySelectorAll('.minutes');
        const fullTimeElements = row.querySelectorAll('.full-time');
        
        // Set both arrival times to n/a
        minutesElements.forEach(el => {
            el.textContent = 'n/a';
            el.classList.add('na-text'); // Add class for styling
        });
        fullTimeElements.forEach(el => el.textContent = '');
    }
}

// Function to update a specific row by index
function updateRowData(rowIndex, data) {
    const rows = document.querySelector('.arrivals-table').querySelectorAll('tr');
    if (rowIndex < rows.length) {
        const row = rows[rowIndex];
        
        // Get the elements for updating
        const minutesElements = row.querySelectorAll('.minutes');
        const fullTimeElements = row.querySelectorAll('.full-time');
        
        // First arrival time
        if (data.firstEtaTime) {
            const now = new Date();
            const diffMs = Math.max(0, data.firstEtaTime - now); // Ensure non-negative value
            const diffSeconds = Math.floor(diffMs / 1000);
            
            // Set the minutes display with appropriate formatting
            if (diffSeconds < 60) {
                // Less than 60 seconds - show "now" in green
                minutesElements[0].textContent = 'now';
                minutesElements[0].classList.add('now-text');
                minutesElements[0].classList.remove('na-text');
            } else if (diffSeconds < 120) {
                // Between 60-119 seconds - show "1 min" in normal color
                minutesElements[0].textContent = '1 min';
                minutesElements[0].classList.remove('now-text');
                minutesElements[0].classList.remove('na-text');
            } else {
                // 2 minutes or more - calculate exact minute value and round up
                const minutesUntil = Math.ceil(diffMs / 60000);
                minutesElements[0].textContent = `${minutesUntil} mins`;
                minutesElements[0].classList.remove('now-text');
                minutesElements[0].classList.remove('na-text');
            }
            
            // Add full time display in HH:MM:SS format
            const hours = data.firstEtaTime.getHours().toString().padStart(2, '0');
            const minutes = data.firstEtaTime.getMinutes().toString().padStart(2, '0');
            const seconds = data.firstEtaTime.getSeconds().toString().padStart(2, '0');
            fullTimeElements[0].textContent = `${hours}:${minutes}:${seconds}`;
        } else {
            // No first ETA data
            minutesElements[0].textContent = 'n/a';
            minutesElements[0].classList.remove('now-text');
            minutesElements[0].classList.add('na-text');
            fullTimeElements[0].textContent = '';
        }
        
        // Second arrival time (if available)
        if (data.hasSecondEta && data.secondEtaTime) {
            const now = new Date();
            const diffMs = Math.max(0, data.secondEtaTime - now); // Ensure non-negative value
            const diffSeconds = Math.floor(diffMs / 1000);
            
            // Set the minutes display with appropriate formatting
            if (diffSeconds < 60) {
                // Less than 60 seconds - show "now" in green
                minutesElements[1].textContent = 'now';
                minutesElements[1].classList.add('now-text');
                minutesElements[1].classList.remove('na-text');
            } else if (diffSeconds < 120) {
                // Between 60-119 seconds - show "1 min" in normal color
                minutesElements[1].textContent = '1 min';
                minutesElements[1].classList.remove('now-text');
                minutesElements[1].classList.remove('na-text');
            } else {
                // 2 minutes or more - calculate exact minute value and round up
                const minutesUntil = Math.ceil(diffMs / 60000);
                minutesElements[1].textContent = `${minutesUntil} mins`;
                minutesElements[1].classList.remove('now-text');
                minutesElements[1].classList.remove('na-text');
            }
            
            // Add full time display in HH:MM:SS format
            const hours = data.secondEtaTime.getHours().toString().padStart(2, '0');
            const minutes = data.secondEtaTime.getMinutes().toString().padStart(2, '0');
            const seconds = data.secondEtaTime.getSeconds().toString().padStart(2, '0');
            fullTimeElements[1].textContent = `${hours}:${minutes}:${seconds}`;
        } else {
            // No second ETA
            minutesElements[1].textContent = 'n/a';
            minutesElements[1].classList.remove('now-text');
            minutesElements[1].classList.add('na-text');
            fullTimeElements[1].textContent = '';
        }
    }
}

// Function to update LRT rows that have a different time format
function updateLrtRowData(rowIndex, data) {
    const tbody = document.querySelector('.arrivals-table tbody');
    const row = tbody.children[rowIndex];
    
    if (row) {
        const routeCell = row.querySelector('td.route-cell');
        const timeCell = row.querySelector('td:nth-child(2)');
        const nextTimeCell = row.querySelector('td:nth-child(3)');
        
        if (routeCell && timeCell && nextTimeCell) {
            const routeNumber = routeCell.querySelector('.route-number');
            const stationName = routeCell.querySelector('.station-name');
            
            if (routeNumber && stationName) {
                routeNumber.textContent = data.route;
                stationName.textContent = data.station;
            }
            
            // Clear existing content
            timeCell.innerHTML = '';
            nextTimeCell.innerHTML = '';
            
            // First arrival time
            const minutesSpan = document.createElement('span');
            minutesSpan.className = 'minutes';
            
            // Add debug info
            console.log(`${data.route} 1st LRT arrival: time=${data.firstTimeStr}`);
            
            if (data.firstTimeStr && data.firstTimeStr !== '--') {
                // Handle different time string formats
                if (data.firstTimeStr === '-' || data.firstTimeStr === 'Arriving') {
                    // Less than 60 seconds - show "now"
                    minutesSpan.textContent = 'now';
                    minutesSpan.classList.add('now-text');
                } else if (data.firstTimeStr.includes('min')) {
                    // Parse minutes value
                    const minText = data.firstTimeStr.split(' ')[0];
                    const minValue = parseInt(minText);
                    
                    if (!isNaN(minValue)) {
                        if (minValue === 1) {
                            // Exactly "1 min"
                            minutesSpan.textContent = '1 min';
                            minutesSpan.classList.remove('now-text');
                        } else {
                            // 2+ minutes
                            minutesSpan.textContent = `${minValue} mins`;
                            minutesSpan.classList.remove('now-text');
                        }
                    } else {
                        // Fallback if parsing fails
                        minutesSpan.textContent = data.firstTimeStr;
                        minutesSpan.classList.remove('now-text');
                    }
                } else {
                    // Any other text
                    minutesSpan.textContent = data.firstTimeStr;
                    minutesSpan.classList.remove('now-text');
                }
            } else {
                minutesSpan.textContent = 'n/a';
                minutesSpan.classList.add('na-text');
            }
            
            timeCell.appendChild(minutesSpan);
            
            // Only show full time if we have a valid date object
            if (data.firstEtaTime) {
                const fullTimeSpan = document.createElement('span');
                fullTimeSpan.className = 'full-time';
                fullTimeSpan.textContent = data.firstEtaTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit', 
                    hour12: false 
                });
                timeCell.appendChild(fullTimeSpan);
            }
            
            // Second arrival time
            const nextMinutesSpan = document.createElement('span');
            nextMinutesSpan.className = 'minutes';
            
            // Add debug info
            console.log(`${data.route} 2nd LRT arrival: time=${data.secondTimeStr}`);
            
            if (data.secondTimeStr && data.secondTimeStr !== '--') {
                // Handle different time string formats
                if (data.secondTimeStr === '-' || data.secondTimeStr === 'Arriving') {
                    // Less than 60 seconds - show "now"
                    nextMinutesSpan.textContent = 'now';
                    nextMinutesSpan.classList.add('now-text');
                } else if (data.secondTimeStr.includes('min')) {
                    // Parse minutes value
                    const minText = data.secondTimeStr.split(' ')[0];
                    const minValue = parseInt(minText);
                    
                    if (!isNaN(minValue)) {
                        if (minValue === 1) {
                            // Exactly "1 min"
                            nextMinutesSpan.textContent = '1 min';
                            nextMinutesSpan.classList.remove('now-text');
                        } else {
                            // 2+ minutes
                            nextMinutesSpan.textContent = `${minValue} mins`;
                            nextMinutesSpan.classList.remove('now-text');
                        }
                    } else {
                        // Fallback if parsing fails
                        nextMinutesSpan.textContent = data.secondTimeStr;
                        nextMinutesSpan.classList.remove('now-text');
                    }
                } else {
                    // Any other text
                    nextMinutesSpan.textContent = data.secondTimeStr;
                    nextMinutesSpan.classList.remove('now-text');
                }
            } else {
                nextMinutesSpan.textContent = 'n/a';
                nextMinutesSpan.classList.add('na-text');
            }
            
            nextTimeCell.appendChild(nextMinutesSpan);
            
            // Only show full time if we have a valid date object
            if (data.secondEtaTime) {
                const nextFullTimeSpan = document.createElement('span');
                nextFullTimeSpan.className = 'full-time';
                nextFullTimeSpan.textContent = data.secondEtaTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit', 
                    hour12: false 
                });
                nextTimeCell.appendChild(nextFullTimeSpan);
            }
            
            nextTimeCell.classList.add('next-arrival');
        }
    }
}

// Update the existing document.addEventListener to call both functions
document.addEventListener('DOMContentLoaded', function() {
    fetchBusData();
    fetchMultipleBusData();
});

// Update the setInterval to refresh all data
setInterval(() => {
    fetchBusData();
    fetchMultipleBusData();
    console.log('All data refreshed');
}, 10000); // Refresh every 10 seconds to ensure accurate countdown tracking for "now" and "1 min" states

// Add refresh button functionality if needed
document.addEventListener('keydown', function(event) {
    // Refresh data when F5 or Ctrl+R is pressed
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        fetchBusData();
        fetchMultipleBusData();
    }
});

function processLrtData(data, route) {
    // Extract platform data for the specific route
    const platformData = data.platform_list.find(p => 
        p.route_list.some(r => r.route_no === route)
    );

    if (platformData) {
        const routeData = platformData.route_list.find(r => r.route_no === route);
        if (routeData && routeData.train_length > 0) {
            // Get the first and second times
            const firstTimeStr = routeData.time_en === '-' ? 'now' : routeData.time_en;
            const secondTimeStr = routeData.next_train_time === '-' ? 'now' : routeData.next_train_time;

            return {
                route: route,
                station: platformData.platform_id,
                firstTimeStr: firstTimeStr,
                secondTimeStr: secondTimeStr,
                firstEtaTime: null,  // LRT doesn't provide exact timestamps
                secondEtaTime: null  // LRT doesn't provide exact timestamps
            };
        }
    }
    return null;
}

// Function to update only the first row
function updateFirstRow(data) {
    const firstRow = document.querySelector('.arrivals-table tbody tr:first-child');
    if (firstRow) {
        const routeCell = firstRow.querySelector('td.route-cell');
        const timeCell = firstRow.querySelector('td:nth-child(2)');
        const nextTimeCell = firstRow.querySelector('td:nth-child(3)');
        
        // Update the cells with new data
        if (routeCell && timeCell && nextTimeCell) {
            const routeNumber = routeCell.querySelector('.route-number');
            const stationName = routeCell.querySelector('.station-name');
            
            if (routeNumber && stationName) {
                routeNumber.textContent = data.route;
                stationName.textContent = data.station;
            }
            
            // Update first arrival time
            updateTimeCell(timeCell, data.firstEtaTime);
            
            // Update second arrival time or show n/a
            if (data.hasSecondEta) {
                updateTimeCell(nextTimeCell, data.secondEtaTime);
            } else {
                nextTimeCell.innerHTML = '<span class="minutes">n/a</span>';
            }
            
            nextTimeCell.classList.add('next-arrival');
        }
    }
} 