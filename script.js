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
function updateTimeCell(cell, etaTime, nowThresholdSeconds = 30) {
    cell.innerHTML = '';
    
    if (etaTime) {
        const now = new Date();
        const diffMs = Math.max(0, etaTime - now); // Ensure non-negative
        const diffSeconds = Math.floor(diffMs / 1000);
        
        const minutesSpan = document.createElement('span');
        minutesSpan.className = 'minutes';
        
        // Use the passed threshold (default 30 seconds) for determining "now"
        if (diffSeconds < nowThresholdSeconds) {
            minutesSpan.textContent = 'now';
            minutesSpan.classList.add('now-text');
        } else if (diffSeconds < 120) {
            minutesSpan.textContent = '1 min';
        } else {
            const minutesUntil = Math.ceil(diffMs / 60000);
            minutesSpan.textContent = `${minutesUntil} mins`;
        }
        
        cell.appendChild(minutesSpan);
        
        // Add full time
        const fullTimeSpan = document.createElement('span');
        fullTimeSpan.className = 'full-time';
        
        const hours = etaTime.getHours().toString().padStart(2, '0');
        const minutes = etaTime.getMinutes().toString().padStart(2, '0');
        const seconds = etaTime.getSeconds().toString().padStart(2, '0');
        fullTimeSpan.textContent = `${hours}:${minutes}:${seconds}`;
        
        cell.appendChild(fullTimeSpan);
    } else {
        // No data
        const minutesSpan = document.createElement('span');
        minutesSpan.className = 'minutes na-text';
        minutesSpan.textContent = 'n/a';
        minutesSpan.style.color = '#cc0000'; // Dark red
        minutesSpan.style.fontWeight = 'bold';
        minutesSpan.classList.remove('now-text'); // Ensure no "now" styling
        cell.appendChild(minutesSpan);
    }
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
            
            // Update 967 row (row 4) with the fetched data
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
        timeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
        nextTimeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
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
            timeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
            nextTimeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
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

// Add these variables to store the last valid K73 data
let lastValidK73Data = null;
let lastK73UpdateTime = null;
const K73_DATA_STALE_THRESHOLD_MS = 30000; // 30 seconds threshold before considering data stale

// Add this new variable to store second bus arrival time for quick shift
let lastK73SecondBusData = null;

// Function to fetch multiple bus data
async function fetchMultipleBusData() {
    try {
        // Fetch data for LRT routes 705 and 706 (now rows 1 and 2)
        const apiLrtUrl = 'https://rt.data.gov.hk/v1/transport/mtr/lrt/getSchedule?station_id=520';
        const responseLrt = await fetch(apiLrtUrl);
        if (responseLrt.ok) {
            const dataLrt = await responseLrt.json();
            
            if (dataLrt && dataLrt.platform_list) {
                // Process route 705 and 706
                let route705Data = { found: false, firstTime: 'n/a', secondTime: 'n/a' };
                let route706Data = { found: false, firstTime: 'n/a', secondTime: 'n/a' };
                
                // Loop through all platforms to find 705 and 706 data
                for (const platform of dataLrt.platform_list) {
                    if (platform.route_list) {
                        // Find all entries for route 705
                        const route705Entries = platform.route_list.filter(train => train.route_no === "705");
                        if (route705Entries.length > 0) {
                            route705Data.found = true;
                            route705Data.firstTime = route705Entries[0].time_en;
                            
                            // Get the second time if available
                            if (route705Entries.length > 1) {
                                route705Data.secondTime = route705Entries[1].time_en;
                            }
                        }
                        
                        // Find all entries for route 706
                        const route706Entries = platform.route_list.filter(train => train.route_no === "706");
                        if (route706Entries.length > 0) {
                            route706Data.found = true;
                            route706Data.firstTime = route706Entries[0].time_en;
                            
                            // Get the second time if available
                            if (route706Entries.length > 1) {
                                route706Data.secondTime = route706Entries[1].time_en;
                            }
                        }
                    }
                }
                
                // Debug log to verify the data being processed
                console.log("LRT 705 data:", route705Data);
                console.log("LRT 706 data:", route706Data);
                
                // Update rows with the data we found
                updateLrtRow(0, {
                    route: '705',
                    station: '天秀',
                    firstTime: route705Data.firstTime,
                    secondTime: route705Data.secondTime
                });
                
                updateLrtRow(1, {
                    route: '706',
                    station: '天秀',
                    firstTime: route706Data.firstTime,
                    secondTime: route706Data.secondTime
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
                console.log("K73 data refreshed:", new Date().toISOString());
                
                let foundK73Data = false;
                let foundOutboundBuses = false;
                
                if (dataK73 && dataK73.busStop && Array.isArray(dataK73.busStop)) {
                    const TARGET_STOP_ID = 'K73-U040';
                    let targetStop = dataK73.busStop.find(stop => stop.busStopId === TARGET_STOP_ID);
                    
                    if (targetStop && targetStop.bus && Array.isArray(targetStop.bus)) {
                        // Filter for buses in the outbound direction (YLW = Yuen Long West)
                        const outboundBuses = targetStop.bus.filter(bus => 
                            bus.lineRef && (bus.lineRef.includes('YLW') || bus.direction === 'O')
                        );
                        
                        foundOutboundBuses = outboundBuses.length > 0;
                        
                        if (foundOutboundBuses) {
                            // Sort by arrival time (not departure time)
                            const sortedBuses = [...outboundBuses].sort((a, b) => {
                                // Use arrivalTimeInSecond instead of departureTimeInSecond to match official app
                                const timeA = parseInt(a.arrivalTimeInSecond, 10) || parseInt(a.departureTimeInSecond, 10) || 999999;
                                const timeB = parseInt(b.arrivalTimeInSecond, 10) || parseInt(b.departureTimeInSecond, 10) || 999999;
                                return timeA - timeB;
                            });
                            
                            // Current time reference
                            const now = new Date();
                            
                            // Begin collecting valid buses (we may find multiple)
                            const validBuses = [];
                            
                            // Process all buses to create a comprehensive list
                            for (let i = 0; i < sortedBuses.length; i++) {
                                const bus = sortedBuses[i];
                                const arrivalSeconds = parseInt(bus.arrivalTimeInSecond, 10);
                                const departureSeconds = parseInt(bus.departureTimeInSecond, 10);
                                
                                // Use arrivalTimeInSecond if it's valid, otherwise use departureTimeInSecond
                                const timeSeconds = (!isNaN(arrivalSeconds) && arrivalSeconds < 108000) 
                                    ? arrivalSeconds 
                                    : departureSeconds;
                                
                                if (!isNaN(timeSeconds) && timeSeconds > 0) {
                                    const etaTime = new Date(now);
                                    etaTime.setSeconds(etaTime.getSeconds() + timeSeconds);
                                    
                                    validBuses.push({
                                        eta: etaTime,
                                        timeSeconds: timeSeconds,
                                        arrivalText: bus.arrivalTimeText
                                    });
                                }
                            }
                            
                            // If we have at least one valid bus
                            if (validBuses.length > 0) {
                                // Store up to 3 buses for better continuity
                                const firstEtaTime = validBuses[0].eta;
                                const secondEtaTime = validBuses.length > 1 ? validBuses[1].eta : null;
                                const thirdEtaTime = validBuses.length > 2 ? validBuses[2].eta : null;
                                
                                // Debug info
                                console.log(`K73 found ${validBuses.length} valid buses`);
                                validBuses.forEach((bus, idx) => {
                                    console.log(`K73 bus ${idx+1}: ${Math.floor(bus.timeSeconds / 60)}m ${bus.timeSeconds % 60}s (${bus.arrivalText})`);
                                });
                                
                                // Store the valid data with additional buses
                                lastValidK73Data = {
                                    route: 'K73',
                                    station: '天晴邨晴碧樓',
                                    firstEtaTime: firstEtaTime,
                                    secondEtaTime: secondEtaTime,
                                    hasSecondEta: !!secondEtaTime,
                                    type: 'bus',
                                    timestamp: now,
                                    allBuses: validBuses
                                };
                                lastK73UpdateTime = now;
                                
                                // Store second and third bus data separately for shifting when needed
                                lastK73SecondBusData = secondEtaTime ? { eta: secondEtaTime } : null;
                                
                                // Also store all extra buses for better continuity
                                if (!window.k73ExtraBuses) window.k73ExtraBuses = [];
                                // Only replace the buses if we have new ones - prevents corrupting data during transitions
                                if (secondEtaTime || thirdEtaTime) {
                                    let extraBuses = [];
                                    if (secondEtaTime) extraBuses.push(secondEtaTime);
                                    if (thirdEtaTime) extraBuses.push(thirdEtaTime);
                                    window.k73ExtraBuses = extraBuses;
                                }
                                
                                // Update K73 row (row index 2)
                                updateRowData(2, lastValidK73Data);
                                
                                foundK73Data = true;
                                return true;
                            }
                        }
                    }
                }
                
                // If we found the stop but no buses, we can use the data shifting more confidently
                if (!foundK73Data) {
                    console.log(`K73 refresh: stop found=${!!targetStop}, outbound buses found=${foundOutboundBuses}`);
                    
                    const now = new Date();
                    
                    // We have more confidence in the shift when we know the stop exists but has no buses
                    const shouldShift = foundOutboundBuses === false && !!targetStop;
                    
                    // Only use our stored lastValidK73Data first - it's more accurate than the extra buses during transitions
                    if (shouldShift && lastValidK73Data && lastValidK73Data.secondEtaTime) {
                        console.log("Using stored K73 second bus data as primary");
                        
                        // Calculate time adjustment
                        const timeSinceUpdate = now - lastK73UpdateTime;
                        const adjustedEta = new Date(lastValidK73Data.secondEtaTime.getTime() - timeSinceUpdate);
                        
                        // Only use if it's still in the future and not too close (more than 5 seconds away)
                        if (adjustedEta > now && (adjustedEta - now) > 5000) {
                            // Create new data structure with second bus as first
                            const shiftedData = {
                                route: 'K73',
                                station: '天晴邨晴碧樓',
                                firstEtaTime: adjustedEta,
                                secondEtaTime: window.k73ExtraBuses.length > 0 ? window.k73ExtraBuses[0] : null,
                                hasSecondEta: window.k73ExtraBuses.length > 0,
                                type: 'bus'
                            };
                            
                            // Clear second bus from lastValidK73Data to prevent incorrect shifting next time
                            lastValidK73Data.secondEtaTime = null;
                            lastValidK73Data.hasSecondEta = false;
                            
                            updateRowData(2, shiftedData);
                            console.log("Successfully shifted using lastValidK73Data second bus");
                            return true;
                        }
                    }
                    // Fall back to extra buses if we don't have valid second bus data
                    else if (shouldShift && window.k73ExtraBuses && window.k73ExtraBuses.length > 0) {
                        console.log("Shifting K73 to use next available bus from extras");
                        
                        // Get the next bus from our cache
                        const nextBus = window.k73ExtraBuses.shift(); // Take the first one and remove it
                        
                        if (nextBus) {
                            // Adjust time based on elapsed time
                            const timeSinceUpdate = now - lastK73UpdateTime;
                            const adjustedEta = new Date(nextBus.getTime() - timeSinceUpdate);
                            
                            // Only use if it's still in the future and not too close
                            if (adjustedEta > now && (adjustedEta - now) > 5000) {
                                const shiftedData = {
                                    route: 'K73',
                                    station: '天晴邨晴碧樓',
                                    firstEtaTime: adjustedEta,
                                    secondEtaTime: window.k73ExtraBuses.length > 0 ? window.k73ExtraBuses[0] : null,
                                    hasSecondEta: window.k73ExtraBuses.length > 0,
                                    type: 'bus'
                                };
                                
                                updateRowData(2, shiftedData);
                                console.log("Successfully shifted to next K73 bus from extras");
                                return true;
                            }
                        }
                    }
                    
                    // If no data could be found or shifted, display n/a in dark red
                    if (!foundK73Data) {
                        updateK73RowNoData();
                    }
                }
            } catch (error) {
                console.error('Error processing K73 data:', error);
                updateK73RowNoData();
                
                // Try fallback mechanisms
                // ... existing fallback code ...
            }
        } else {
            console.error('Failed to fetch K73 data, status:', responseK73.status);
            updateK73RowNoData();
            
            // Try fallback mechanisms
            // ... existing fallback code ...
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
            console.log('269M raw data:', data269.data); // Debug log
            
            if (data269 && data269.data && data269.data.length > 0) {
                // Filter out entries with null eta or "最後班次已過" remark
                const validEntries = data269.data.filter(entry => 
                    entry.eta !== null && 
                    entry.rmk_tc !== "最後班次已過" &&
                    new Date(entry.eta) > new Date()
                );
                
                if (validEntries.length > 0) {
                    const firstEta = new Date(validEntries[0].eta);
                    
                    // Use second entry if available
                    let secondEta;
                    let hasSecondEta = false;
                    
                    if (validEntries.length > 1) {
                        secondEta = new Date(validEntries[1].eta);
                        hasSecondEta = true;
                    } else {
                        // Fallback date (won't be displayed)
                        secondEta = new Date(firstEta);
                        secondEta.setMinutes(secondEta.getMinutes() + 30);
                    }
                    
                    // Debug log
                    console.log('269M times:', {
                        firstEta: firstEta.toISOString(),
                        secondEta: secondEta.toISOString(),
                        now: new Date().toISOString()
                    });
                    
                    updateRowData(6, {
                        route: '269M',
                        station: '晴碧樓',
                        firstEtaTime: firstEta,
                        secondEtaTime: secondEta,
                        hasSecondEta: hasSecondEta,
                        type: 'bus'
                    });
                } else {
                    // No valid entries (all null or "最後班次已過")
                    updateRowNoData(6);
                }
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
                // Filter out entries with null eta or "最後班次已過" remark
                const validEntries = data265.data.filter(entry => 
                    entry.eta !== null && 
                    entry.rmk_tc !== "最後班次已過" &&
                    new Date(entry.eta) > new Date()
                );
                
                if (validEntries.length > 0) {
                    const firstEta = new Date(validEntries[0].eta);
                    
                    // Use second entry if available
                    let secondEta;
                    let hasSecondEta = false;
                    
                    if (validEntries.length > 1) {
                        secondEta = new Date(validEntries[1].eta);
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
                    // No valid entries (all null or "最後班次已過")
                    updateRowNoData(7);
                }
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
                // Filter out entries with null eta or "最後班次已過" remark
                const validEntries = data269C.data.filter(entry => 
                    entry.eta !== null && 
                    entry.rmk_tc !== "最後班次已過" &&
                    new Date(entry.eta) > new Date()
                );
                
                if (validEntries.length > 0) {
                    const firstEta = new Date(validEntries[0].eta);
                    
                    // Use second entry if available
                    let secondEta;
                    let hasSecondEta = false;
                    
                    if (validEntries.length > 1) {
                        secondEta = new Date(validEntries[1].eta);
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
                    // No valid entries (all null or "最後班次已過")
                    updateRowNoData(8);
                }
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
                // Filter out entries with null eta or "最後班次已過" remark
                const validEntries = data276B.data.filter(entry => 
                    entry.eta !== null && 
                    entry.rmk_tc !== "最後班次已過" &&
                    new Date(entry.eta) > new Date()
                );
                
                if (validEntries.length > 0) {
                    const firstEta = new Date(validEntries[0].eta);
                    
                    // Use second entry if available
                    let secondEta;
                    let hasSecondEta = false;
                    
                    if (validEntries.length > 1) {
                        secondEta = new Date(validEntries[1].eta);
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
                    // No valid entries (all null or "最後班次已過")
                    updateRowNoData(9);
                }
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
                // First filter by destination
                const filteredByDest = data276B2.data.filter(item => item.dest_tc === '天富');
                
                // Then filter out null eta values or "最後班次已過" remark
                const validEntries = filteredByDest.filter(entry => 
                    entry.eta !== null && 
                    entry.rmk_tc !== "最後班次已過" &&
                    new Date(entry.eta) > new Date()
                );
                
                if (validEntries.length > 0) {
                    const firstEta = new Date(validEntries[0].eta);
                    
                    // Use second entry if available
                    let secondEta;
                    let hasSecondEta = false;
                    
                    if (validEntries.length > 1) {
                        secondEta = new Date(validEntries[1].eta);
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
                    // No valid entries after filtering
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
                // Filter out entries with null eta or "最後班次已過" remark
                const validEntries = data265B.data.filter(entry => 
                    entry.eta !== null && 
                    entry.rmk_tc !== "最後班次已過" &&
                    new Date(entry.eta) > new Date()
                );
                
                if (validEntries.length > 0) {
                    const firstEta = new Date(validEntries[0].eta);
                    
                    // Use second entry if available
                    let secondEta;
                    let hasSecondEta = false;
                    
                    if (validEntries.length > 1) {
                        secondEta = new Date(validEntries[1].eta);
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
                    // No valid entries (all null or "最後班次已過")
                    updateRowNoData(11);
                }
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
                // Filter out entries with null eta or "最後班次已過" remark
                const validEntries = data69.data.filter(entry => 
                    entry.eta !== null && 
                    entry.rmk_tc !== "最後班次已過" &&
                    new Date(entry.eta) > new Date()
                );
                
                if (validEntries.length > 0) {
                    const firstEta = new Date(validEntries[0].eta);
                    
                    // Use second entry if available
                    let secondEta;
                    let hasSecondEta = false;
                    
                    if (validEntries.length > 1) {
                        secondEta = new Date(validEntries[1].eta);
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
                    // No valid entries (all null or "最後班次已過")
                    update69RowNoData();
                }
            } else {
                // No data
                update69RowNoData();
            }
        } else {
            update69RowNoData();
        }
        
        // Update last updated time
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
    } catch (error) {
        console.error('Error fetching bus data:', error);
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
        
        // Special handling for K73 and 69 when there is a general error
        updateK73RowNoData();
        update69RowNoData();
        
        // Mark all other rows as no data when there's an error
        for (let i = 0; i < 13; i++) {
            if (i !== 2 && i !== 12) { // Skip K73 and 69 as they're handled above
                updateRowNoData(i);
            }
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
            el.classList.remove('now-text'); // Remove any "now" styling
            
            // Ensure dark red styling for all routes
            el.style.color = '#cc0000'; // Dark red
            el.style.fontWeight = 'bold';
        });
        fullTimeElements.forEach(el => el.textContent = '');
    }
}

// Special handler for K73 no data case
function updateK73RowNoData() {
    const row = document.querySelector('.arrivals-table tbody tr:nth-child(3)'); // K73 is row 3 (index 2)
    if (row) {
        const timeCell = row.querySelector('td:nth-child(2)');
        const nextTimeCell = row.querySelector('td:nth-child(3)');
        
        if (timeCell && nextTimeCell) {
            timeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
            nextTimeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
        }
    }
}

// Special handler for 69 no data case
function update69RowNoData() {
    const row = document.querySelector('.arrivals-table tbody tr:nth-child(13)'); // 69 is row 13 (index 12)
    if (row) {
        const timeCell = row.querySelector('td:nth-child(2)');
        const nextTimeCell = row.querySelector('td:nth-child(3)');
        
        if (timeCell && nextTimeCell) {
            timeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
            nextTimeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
        }
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
            
            // Add route-specific debug log
            if (data.route === '269M' || data.route === '269C' || data.route === 'K73') {
                console.log(`${data.route} time calculation: diffMs=${diffMs}, diffSeconds=${diffSeconds}, now=${now.toISOString()}, firstEta=${data.firstEtaTime.toISOString()}`);
            }
            
            // Set the minutes display with appropriate formatting
            if (diffSeconds < 30) {
                // Less than 30 seconds - show "now" in green
                minutesElements[0].textContent = 'now';
                minutesElements[0].classList.add('now-text');
                minutesElements[0].classList.remove('na-text');
            } else if (diffSeconds < 120) {
                // Between 30-119 seconds - show "1 min" in normal color
                minutesElements[0].textContent = '1 min';
                minutesElements[0].classList.remove('now-text');
                minutesElements[0].classList.remove('na-text');
            } else {
                // 2 minutes or more - calculate with proper rounding
                // Floor division by 60 then add 1 to ensure we correctly show "2 min" 
                const minutesUntil = Math.floor(diffSeconds / 60) + (diffSeconds % 60 > 0 ? 1 : 0);
                minutesElements[0].textContent = `${minutesUntil} ${minutesUntil === 1 ? 'min' : 'mins'}`;
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
            minutesElements[0].style.color = '#cc0000'; // Dark red
            minutesElements[0].style.fontWeight = 'bold';
            fullTimeElements[0].textContent = '';
        }
        
        // Second arrival time (if available)
        if (data.hasSecondEta && data.secondEtaTime) {
            const now = new Date();
            const diffMs = Math.max(0, data.secondEtaTime - now); // Ensure non-negative value
            const diffSeconds = Math.floor(diffMs / 1000);
            
            // Set the minutes display with appropriate formatting
            if (diffSeconds < 30) {
                // Less than 30 seconds - show "now" in green
                minutesElements[1].textContent = 'now';
                minutesElements[1].classList.add('now-text');
                minutesElements[1].classList.remove('na-text');
            } else if (diffSeconds < 120) {
                // Between 30-119 seconds - show "1 min" in normal color
                minutesElements[1].textContent = '1 min';
                minutesElements[1].classList.remove('now-text');
                minutesElements[1].classList.remove('na-text');
            } else {
                // 2 minutes or more - calculate with proper rounding
                // Floor division by 60 then add 1 to ensure we correctly show "2 min"
                const minutesUntil = Math.floor(diffSeconds / 60) + (diffSeconds % 60 > 0 ? 1 : 0);
                minutesElements[1].textContent = `${minutesUntil} ${minutesUntil === 1 ? 'min' : 'mins'}`;
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
            minutesElements[1].style.color = '#cc0000'; // Dark red
            minutesElements[1].style.fontWeight = 'bold';
            fullTimeElements[1].textContent = '';
        }
    }
}

// Function to update LRT rows that have a different time format
function updateLrtRow(rowIndex, data) {
    const rows = document.querySelector('.arrivals-table').querySelectorAll('tr');
    if (rowIndex < rows.length) {
        const row = rows[rowIndex];
        
        // Get cells for updating
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
            
            // Process the first arrival time
            if (data.firstTime && data.firstTime !== '--' && data.firstTime !== 'n/a') {
                // Handle "-" or "Arriving" as "now"
                if (data.firstTime === '-' || data.firstTime === 'Arriving') {
                    minutesSpan.textContent = 'now';
                    minutesSpan.classList.add('now-text');
                } else {
                    // Keep original time string (e.g., "3 min")
                    minutesSpan.textContent = data.firstTime;
                    minutesSpan.classList.remove('now-text');
                }
                minutesSpan.classList.remove('na-text');
            } else {
                minutesSpan.textContent = 'n/a';
                minutesSpan.classList.add('na-text');
                minutesSpan.classList.remove('now-text');
                minutesSpan.style.color = '#cc0000'; // Dark red
                minutesSpan.style.fontWeight = 'bold';
            }
            
            timeCell.appendChild(minutesSpan);
            
            // Second arrival time
            const nextMinutesSpan = document.createElement('span');
            nextMinutesSpan.className = 'minutes';
            
            // Process the second arrival time
            if (data.secondTime && data.secondTime !== '--' && data.secondTime !== 'n/a') {
                // Handle "-" or "Arriving" as "now"
                if (data.secondTime === '-' || data.secondTime === 'Arriving') {
                    nextMinutesSpan.textContent = 'now';
                    nextMinutesSpan.classList.add('now-text');
                } else {
                    // Keep original time string (e.g., "8 min")
                    nextMinutesSpan.textContent = data.secondTime;
                    nextMinutesSpan.classList.remove('now-text');
                }
                nextMinutesSpan.classList.remove('na-text');
            } else {
                nextMinutesSpan.textContent = 'n/a';
                nextMinutesSpan.classList.add('na-text');
                nextMinutesSpan.classList.remove('now-text');
                nextMinutesSpan.style.color = '#cc0000'; // Dark red
                nextMinutesSpan.style.fontWeight = 'bold';
            }
            
            nextTimeCell.appendChild(nextMinutesSpan);
            
            // No full time elements for LRT (as requested)
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
}, 5000); // Refresh every 5 seconds to reduce lag, especially for K73 route data

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
            
            // Update first arrival time using the same improved threshold as updateRowData
            updateTimeCell(timeCell, data.firstEtaTime, 30); // Pass 30-second threshold for "now"
            
            // Update second arrival time or show n/a
            if (data.hasSecondEta) {
                updateTimeCell(nextTimeCell, data.secondEtaTime, 30); // Pass 30-second threshold for "now"
            } else {
                nextTimeCell.innerHTML = '<span class="minutes na-text" style="color:#cc0000;font-weight:bold;">n/a</span>';
            }
            
            nextTimeCell.classList.add('next-arrival');
        }
    }
}

// Update the K73 data handling to be smoother
async function fetchK73Data() {
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
        const dataK73 = await responseK73.json();
        console.log("K73 data refreshed:", new Date().toISOString());
        
        let foundK73Data = false;
        let foundOutboundBuses = false;
        
        if (dataK73 && dataK73.busStop && Array.isArray(dataK73.busStop)) {
            const TARGET_STOP_ID = 'K73-U040';
            let targetStop = dataK73.busStop.find(stop => stop.busStopId === TARGET_STOP_ID);
            
            if (targetStop && targetStop.bus && Array.isArray(targetStop.bus)) {
                // Filter for buses in the outbound direction (YLW = Yuen Long West)
                const outboundBuses = targetStop.bus.filter(bus => 
                    bus.lineRef && (bus.lineRef.includes('YLW') || bus.direction === 'O')
                );
                
                foundOutboundBuses = outboundBuses.length > 0;
                
                if (foundOutboundBuses) {
                    // Sort by arrival time (not departure time)
                    const sortedBuses = [...outboundBuses].sort((a, b) => {
                        // Use arrivalTimeInSecond instead of departureTimeInSecond to match official app
                        const timeA = parseInt(a.arrivalTimeInSecond, 10) || parseInt(a.departureTimeInSecond, 10) || 999999;
                        const timeB = parseInt(b.arrivalTimeInSecond, 10) || parseInt(b.departureTimeInSecond, 10) || 999999;
                        return timeA - timeB;
                    });
                    
                    // Current time reference
                    const now = new Date();
                    
                    // Begin collecting valid buses (we may find multiple)
                    const validBuses = [];
                    
                    // Process all buses to create a comprehensive list
                    for (let i = 0; i < sortedBuses.length; i++) {
                        const bus = sortedBuses[i];
                        const arrivalSeconds = parseInt(bus.arrivalTimeInSecond, 10);
                        const departureSeconds = parseInt(bus.departureTimeInSecond, 10);
                        
                        // Use arrivalTimeInSecond if it's valid, otherwise use departureTimeInSecond
                        const timeSeconds = (!isNaN(arrivalSeconds) && arrivalSeconds < 108000) 
                            ? arrivalSeconds 
                            : departureSeconds;
                        
                        if (!isNaN(timeSeconds) && timeSeconds > 0) {
                            const etaTime = new Date(now);
                            etaTime.setSeconds(etaTime.getSeconds() + timeSeconds);
                            
                            validBuses.push({
                                eta: etaTime,
                                timeSeconds: timeSeconds,
                                arrivalText: bus.arrivalTimeText
                            });
                        }
                    }
                    
                    // If we have at least one valid bus
                    if (validBuses.length > 0) {
                        // Store up to 3 buses for better continuity
                        const firstEtaTime = validBuses[0].eta;
                        const secondEtaTime = validBuses.length > 1 ? validBuses[1].eta : null;
                        const thirdEtaTime = validBuses.length > 2 ? validBuses[2].eta : null;
                        
                        // Debug info
                        console.log(`K73 found ${validBuses.length} valid buses`);
                        validBuses.forEach((bus, idx) => {
                            console.log(`K73 bus ${idx+1}: ${Math.floor(bus.timeSeconds / 60)}m ${bus.timeSeconds % 60}s (${bus.arrivalText})`);
                        });
                        
                        // Store the valid data with additional buses
                        lastValidK73Data = {
                            route: 'K73',
                            station: '天晴邨晴碧樓',
                            firstEtaTime: firstEtaTime,
                            secondEtaTime: secondEtaTime,
                            hasSecondEta: !!secondEtaTime,
                            type: 'bus',
                            timestamp: now,
                            allBuses: validBuses
                        };
                        lastK73UpdateTime = now;
                        
                        // Store second and third bus data separately for shifting when needed
                        lastK73SecondBusData = secondEtaTime ? { eta: secondEtaTime } : null;
                        
                        // Also store all extra buses for better continuity
                        if (!window.k73ExtraBuses) window.k73ExtraBuses = [];
                        // Only replace the buses if we have new ones - prevents corrupting data during transitions
                        if (secondEtaTime || thirdEtaTime) {
                            let extraBuses = [];
                            if (secondEtaTime) extraBuses.push(secondEtaTime);
                            if (thirdEtaTime) extraBuses.push(thirdEtaTime);
                            window.k73ExtraBuses = extraBuses;
                        }
                        
                        // Update K73 row (row index 2)
                        updateRowData(2, lastValidK73Data);
                        
                        foundK73Data = true;
                        return true;
                    }
                }
            }
        }
        
        // If we found the stop but no buses, we can use the data shifting more confidently
        if (!foundK73Data) {
            console.log(`K73 refresh: stop found=${!!targetStop}, outbound buses found=${foundOutboundBuses}`);
            
            const now = new Date();
            
            // We have more confidence in the shift when we know the stop exists but has no buses
            const shouldShift = foundOutboundBuses === false && !!targetStop;
            
            // Only use our stored lastValidK73Data first - it's more accurate than the extra buses during transitions
            if (shouldShift && lastValidK73Data && lastValidK73Data.secondEtaTime) {
                console.log("Using stored K73 second bus data as primary");
                
                // Calculate time adjustment
                const timeSinceUpdate = now - lastK73UpdateTime;
                const adjustedEta = new Date(lastValidK73Data.secondEtaTime.getTime() - timeSinceUpdate);
                
                // Only use if it's still in the future and not too close (more than 5 seconds away)
                if (adjustedEta > now && (adjustedEta - now) > 5000) {
                    // Create new data structure with second bus as first
                    const shiftedData = {
                        route: 'K73',
                        station: '天晴邨晴碧樓',
                        firstEtaTime: adjustedEta,
                        secondEtaTime: window.k73ExtraBuses.length > 0 ? window.k73ExtraBuses[0] : null,
                        hasSecondEta: window.k73ExtraBuses.length > 0,
                        type: 'bus'
                    };
                    
                    // Clear second bus from lastValidK73Data to prevent incorrect shifting next time
                    lastValidK73Data.secondEtaTime = null;
                    lastValidK73Data.hasSecondEta = false;
                    
                    updateRowData(2, shiftedData);
                    console.log("Successfully shifted using lastValidK73Data second bus");
                    return true;
                }
            }
            // Fall back to extra buses if we don't have valid second bus data
            else if (shouldShift && window.k73ExtraBuses && window.k73ExtraBuses.length > 0) {
                console.log("Shifting K73 to use next available bus from extras");
                
                // Get the next bus from our cache
                const nextBus = window.k73ExtraBuses.shift(); // Take the first one and remove it
                
                if (nextBus) {
                    // Adjust time based on elapsed time
                    const timeSinceUpdate = now - lastK73UpdateTime;
                    const adjustedEta = new Date(nextBus.getTime() - timeSinceUpdate);
                    
                    // Only use if it's still in the future and not too close
                    if (adjustedEta > now && (adjustedEta - now) > 5000) {
                        const shiftedData = {
                            route: 'K73',
                            station: '天晴邨晴碧樓',
                            firstEtaTime: adjustedEta,
                            secondEtaTime: window.k73ExtraBuses.length > 0 ? window.k73ExtraBuses[0] : null,
                            hasSecondEta: window.k73ExtraBuses.length > 0,
                            type: 'bus'
                        };
                        
                        updateRowData(2, shiftedData);
                        console.log("Successfully shifted to next K73 bus from extras");
                        return true;
                    }
                }
            }
            
            // If no data could be found or shifted, display n/a in dark red
            if (!foundK73Data) {
                updateK73RowNoData();
            }
        }
        
        return foundK73Data;
    } else {
        console.error('Emergency K73 refresh - Failed to fetch data, status:', responseK73.status);
        // In case of network error, display n/a in dark red
        updateK73RowNoData();
        return false;
    }
} 