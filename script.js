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
    
    // Calculate minutes difference
    const diffMs = etaTime - now;
    const diffMinutes = Math.ceil(diffMs / (1000 * 60)); // Round up to next minute
    
    // Format the full time display
    const timeString = etaTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    });
    
    return {
        minutes: diffMinutes <= 0 ? '-' : `${diffMinutes} min${diffMinutes > 1 ? 's' : ''}`,
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
    
    const fullTimeSpan = document.createElement('span');
    fullTimeSpan.className = 'full-time';
    fullTimeSpan.textContent = timeInfo.fullTime;
    
    cell.appendChild(minutesSpan);
    cell.appendChild(fullTimeSpan);
}

// Function to fetch bus data
async function fetchBusData() {
    try {
        // Fetch real-time data from the API
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
            
            // Update only the first row with the fetched data
            updateFirstRow({
                route: firstBusData.route,
                station: '慧景軒', // Using the requested station name
                firstEtaTime: firstEtaTime,
                secondEtaTime: secondEtaTime,
                hasSecondEta: data.data.length > 1, // Flag to indicate if second ETA exists
                type: 'bus'
            });
        } else {
            // No data received
            updateFirstRowNoData();
        }
        
        // Update last updated time
        const now = new Date();
        const updateTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('last-update').textContent = updateTimeString;
        
    } catch (error) {
        console.error('Error fetching bus data:', error);
        // In case of error, show n/a
        updateFirstRowNoData();
    }
}

// Helper function when no data is available for first row
function updateFirstRowNoData() {
    const timeCell = document.querySelector('.arrivals-table tbody tr:first-child td:nth-child(2)');
    const nextTimeCell = document.querySelector('.arrivals-table tbody tr:first-child td:nth-child(3)');
    
    if (timeCell && nextTimeCell) {
        timeCell.innerHTML = '<span class="minutes">n/a</span>';
        nextTimeCell.innerHTML = '<span class="minutes">n/a</span>';
    }
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
        // First route already handled by fetchBusData()
        
        // Fetch data for new 969 route (慧景軒)
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
                
                updateRowData(1, {
                    route: '969',
                    station: '慧景軒',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(1);
            }
        } else {
            updateRowNoData(1);
        }
        
        // Fetch data for route 969 (晴彩樓) - was row 1, now row 2
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
                
                updateRowData(2, {
                    route: '969',
                    station: '晴彩樓',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(2);
            }
        } else {
            updateRowNoData(2);
        }
        
        // Fetch data for route 269M - was row 2, now row 3
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
                
                updateRowData(3, {
                    route: '269M',
                    station: '晴碧樓',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    hasSecondEta: hasSecondEta,
                    type: 'bus'
                });
            } else {
                // No data
                updateRowNoData(3);
            }
        } else {
            updateRowNoData(3);
        }
        
        // Fetch data for route 265M - was row 3, now row 4
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
                
                updateRowData(4, {
                    route: '265M',
                    station: '晴彩樓',
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
        
        // Fetch data for route 269C - was row 4, now row 5
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
                
                updateRowData(5, {
                    route: '269C',
                    station: '麗湖居',
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
        
        // Fetch data for route 276B (慧景軒) - was row 5, now row 6
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
                
                updateRowData(6, {
                    route: '276B',
                    station: '慧景軒',
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
        
        // Fetch data for route 276B (彩園總站) with destination filter - was row 6, now row 7
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
                    
                    updateRowData(7, {
                        route: '276B',
                        station: '彩園總站',
                        firstEtaTime: firstEta,
                        secondEtaTime: secondEta,
                        hasSecondEta: hasSecondEta,
                        type: 'bus'
                    });
                } else {
                    // No "天富" destinations found
                    updateRowNoData(7);
                }
            } else {
                updateRowNoData(7);
            }
        } else {
            updateRowNoData(7);
        }
        
        // Fetch data for route 265B - was row 7, now row 8
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
                
                updateRowData(8, {
                    route: '265B',
                    station: '晴彩樓',
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
        
        // Fetch data for LRT routes 705 and 706 - were rows 8 and 9, now rows 9 and 10
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
                    const now = new Date();
                    const result = new Date(now);
                    
                    if (timeStr === "--" || timeStr === "n/a") {
                        // No service, set a future time for display
                        result.setMinutes(result.getMinutes() + 60);
                        return result;
                    }
                    
                    // Replace "Arriving" with "1 min"
                    if (timeStr === "Arriving") {
                        timeStr = "1 min";
                    }
                    
                    // If it's a minutes format like "1 min" or "2 mins"
                    if (timeStr.includes("min")) {
                        const minutes = parseInt(timeStr.split(" ")[0]);
                        if (!isNaN(minutes)) {
                            result.setMinutes(result.getMinutes() + minutes);
                            return result;
                        }
                    }
                    
                    // Handle other time formats
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
                
                // Update row for route 705
                updateLrtRowData(9, {
                    route: '705',
                    station: '天秀',
                    firstEtaTime: firstEta,
                    secondEtaTime: secondEta,
                    firstTimeStr: firstTimeStr,
                    secondTimeStr: secondTimeStr,
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
                
                // Update row for route 706
                updateLrtRowData(10, {
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
                updateRowNoData(9); // For route 705
                updateRowNoData(10); // For route 706
            }
        } else {
            // API error
            updateRowNoData(9); // For route 705
            updateRowNoData(10); // For route 706
        }
        
        // Update last updated time
        const now = new Date();
        const updateTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('last-update').textContent = updateTimeString;
        
    } catch (error) {
        console.error('Error fetching multiple bus data:', error);
    }
}

// Helper function for when no data is available for a specific row
function updateRowNoData(rowIndex) {
    const tbody = document.querySelector('.arrivals-table tbody');
    const row = tbody.children[rowIndex];
    
    if (row) {
        const timeCell = row.querySelector('td:nth-child(2)');
        const nextTimeCell = row.querySelector('td:nth-child(3)');
        
        if (timeCell && nextTimeCell) {
            timeCell.innerHTML = '<span class="minutes">n/a</span>';
            nextTimeCell.innerHTML = '<span class="minutes">n/a</span>';
        }
    }
}

// Function to update a specific row by index
function updateRowData(rowIndex, data) {
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
            
            // First arrival time - Always show API time string if available, or "n/a" if not
            const minutesSpan = document.createElement('span');
            minutesSpan.className = 'minutes';
            
            // If we have time data, format it properly
            if (data.firstTimeStr && data.firstTimeStr !== '--') {
                // Add 's' for pluralization if needed but prevent double "s"
                if (data.firstTimeStr.includes('min')) {
                    // Check if it's "1 min"
                    if (data.firstTimeStr.startsWith('1 min')) {
                        data.firstTimeStr = '1 min';
                    } else {
                        // For other values, ensure it has only one "s" at the end
                        const minValue = parseInt(data.firstTimeStr);
                        if (!isNaN(minValue) && minValue > 1) {
                            data.firstTimeStr = `${minValue} mins`;
                        }
                    }
                }
                minutesSpan.textContent = data.firstTimeStr;
            } else {
                // No data available
                minutesSpan.textContent = 'n/a';
            }
            
            timeCell.appendChild(minutesSpan);
            
            // Only show full time if we have a valid date object and valid time string
            if (data.firstTimeStr && data.firstTimeStr !== '--' && !data.firstTimeStr.includes('n/a')) {
                const fullTimeSpan = document.createElement('span');
                fullTimeSpan.className = 'full-time';
                fullTimeSpan.textContent = formatArrivalTime(data.firstEtaTime).fullTime;
                timeCell.appendChild(fullTimeSpan);
            }
            
            // Second arrival time - Always show API time string if available, or "n/a" if not
            const nextMinutesSpan = document.createElement('span');
            nextMinutesSpan.className = 'minutes';
            
            // If we have a second time, format it properly
            if (data.secondTimeStr && data.secondTimeStr !== '--') {
                // Add 's' for pluralization if needed but prevent double "s"
                if (data.secondTimeStr.includes('min')) {
                    // Check if it's "1 min"
                    if (data.secondTimeStr.startsWith('1 min')) {
                        data.secondTimeStr = '1 min';
                    } else {
                        // For other values, ensure it has only one "s" at the end
                        const minValue = parseInt(data.secondTimeStr);
                        if (!isNaN(minValue) && minValue > 1) {
                            data.secondTimeStr = `${minValue} mins`;
                        }
                    }
                }
                nextMinutesSpan.textContent = data.secondTimeStr;
            } else {
                // No data available for second time
                nextMinutesSpan.textContent = 'n/a';
            }
            
            nextTimeCell.appendChild(nextMinutesSpan);
            
            // Only show full time if we have a valid date object and valid time string
            if (data.secondTimeStr && data.secondTimeStr !== '--' && !data.secondTimeStr.includes('n/a')) {
                const nextFullTimeSpan = document.createElement('span');
                nextFullTimeSpan.className = 'full-time';
                nextFullTimeSpan.textContent = formatArrivalTime(data.secondEtaTime).fullTime;
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
}, 30000);

// Add refresh button functionality if needed
document.addEventListener('keydown', function(event) {
    // Refresh data when F5 or Ctrl+R is pressed
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        fetchBusData();
        fetchMultipleBusData();
    }
}); 