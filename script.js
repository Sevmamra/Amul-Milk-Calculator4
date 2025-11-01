document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const elements = {
        productListDiv: document.getElementById('product-list'),
        autoCalculateToggle: document.getElementById('auto-calculate'),
        calculateBtn: document.getElementById('calculate-btn'),
        saveBtn: document.getElementById('save-btn'),
        resetBtn: document.getElementById('reset-btn'),
        totalAmountSpan: document.getElementById('total-amount'),
        totalCratesSpan: document.getElementById('total-crates'),
        toast: document.getElementById('toast'),
        searchInput: document.getElementById('search-input'),
        searchClearBtn: document.getElementById('search-clear-btn'),
        loadLastOrderBtn: document.getElementById('load-last-order-btn'),
        // Modals & Tabs
        historyModal: document.getElementById('history-modal'),
        orderDetailsModal: document.getElementById('order-details-modal'),
        settingsModal: document.getElementById('settings-modal'),
        editProductModal: document.getElementById('edit-product-modal'), // CHANGE #4: Edit Modal
        modalTabs: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        // History Elements
        historyBtn: document.getElementById('history-btn'),
        closeHistoryBtn: document.getElementById('close-history'),
        historyListDiv: document.getElementById('history-list'),
        startDateFilter: document.getElementById('start-date-filter'),
        endDateFilter: document.getElementById('end-date-filter'),
        applyFilterBtn: document.getElementById('apply-filter-btn'),
        downloadBtn: document.getElementById('download-btn'),
        selectAllHistoryBtn: document.getElementById('select-all-history-btn'),
        deleteSelectedHistoryBtn: document.getElementById('delete-selected-history-btn'),
        // Analytics Elements
        analyticsMonthFilter: document.getElementById('analytics-month-filter'),
        runAnalyticsBtn: document.getElementById('run-analytics-btn'),
        analyticsContent: document.getElementById('analytics-content'),
        downloadAnalyticsPdfBtn: document.getElementById('download-analytics-pdf-btn'),
        // Order Details Elements
        closeOrderDetailsBtn: document.getElementById('close-order-details'),
        orderDetailsListDiv: document.getElementById('order-details-list'),
        // Settings Elements
        settingsBtn: document.getElementById('settings-btn'),
        closeSettingsBtn: document.getElementById('close-settings'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        themeIcon: document.getElementById('theme-toggle-btn').querySelector('i'),
        exportDataBtn: document.getElementById('export-data-btn'),
        importFileInput: document.getElementById('import-file-input'),
        addProductForm: document.getElementById('add-product-form'),
        manageProductListDiv: document.getElementById('manage-product-list'),
        // CHANGE #4: Edit Product Form Elements
        closeEditProductBtn: document.getElementById('close-edit-product'),
        editProductForm: document.getElementById('edit-product-form'),
    };

    let allProducts = [];
    let charts = {}; // To hold chart instances

    // --- STORAGE & DATA FUNCTIONS ---
    const getProducts = () => JSON.parse(localStorage.getItem('amulCalcProducts')) || [];
    const saveProducts = (products) => localStorage.setItem('amulCalcProducts', JSON.stringify(products));
    const getHistory = () => (JSON.parse(localStorage.getItem('amulCalcHistory')) || []).sort((a,b) => new Date(b.date) - new Date(a.date));
    const saveHistory = (history) => localStorage.setItem('amulCalcHistory', JSON.stringify(history));
    const getTheme = () => localStorage.getItem('theme') || 'dark';
    const saveTheme = (theme) => localStorage.setItem('theme', theme);

    // --- CORE FUNCTIONS ---
    const showToast = (message) => {
        elements.toast.textContent = message;
        elements.toast.classList.add('show');
        setTimeout(() => elements.toast.classList.remove('show'), 2000);
    };

    const calculateTotal = () => {
        let total = 0;
        let crateCount = 0;
        document.querySelectorAll('.product-card').forEach(card => {
            if (card.style.display === 'none') return;
            // CHANGE #7 & #5: Use parseFloat to allow decimals
            const quantity = parseFloat(card.querySelector('.quantity-display').value) || 0;
            const price = parseFloat(card.dataset.price);
            const container = card.dataset.container;
            
            total += quantity * price;
            if (container === 'crate') {
                crateCount += quantity; // This will now add decimals
            }
        });
        elements.totalAmountSpan.textContent = `₹ ${total.toFixed(2)}`;
        // CHANGE #7 & #5: Show decimals for crates
        elements.totalCratesSpan.textContent = crateCount.toFixed(1);
        return { total, crateCount };
    };

    const resetQuantities = () => {
        document.querySelectorAll('.quantity-display').forEach(input => input.value = '0');
        calculateTotal();
    }

    const createProductCardHTML = (p) => `
        <div class="product-card" data-id="${p.id}" data-price="${p.price}" data-name="${p.name} - ${p.size}" data-container="${p.container}">
            <div class="product-info">
                <div class="product-name">${p.name} - ${p.size}</div>
                <div class="product-price">Rate: ₹${p.price.toFixed(2)}</div>
            </div>
            <div class="quantity-stepper">
                <button class="quantity-btn minus-btn"><i class="fas fa-minus"></i></button>
                <input type="text" class="quantity-display" value="0" inputmode="decimal">
                <button class="quantity-btn plus-btn"><i class="fas fa-plus"></i></button>
            </div>
        </div>`;

    const getFrequentlyOrdered = () => {
        const history = getHistory();
        const usageCount = {};
        history.slice(0, 50).forEach(order => { // Look at last 50 orders for relevance
            order.items.forEach(item => {
                usageCount[item.id] = (usageCount[item.id] || 0) + item.quantity;
            });
        });
        const sorted = Object.keys(usageCount).sort((a, b) => usageCount[b] - usageCount[a]);
        return sorted.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
    };

    const displayProducts = () => {
        allProducts = getProducts();
        const frequentlyOrdered = getFrequentlyOrdered();
        const grouped = allProducts.reduce((acc, p) => {
            acc[p.category] = [...(acc[p.category] || []), p];
            return acc;
        }, {});

        let html = '';

        if (frequentlyOrdered.length > 0) {
            html += `
                <div class="category-header" data-category="My Order">
                    <h2 class="category-title"><i class="fas fa-star" style="color: #f59e0b;"></i> My Order</h2>
                    <i class="fas fa-chevron-down category-toggle-icon"></i>
                </div>
                <div class="products-container" data-category-content="My Order">
                    ${frequentlyOrdered.map(createProductCardHTML).join('')}
                </div>`;
        }
        
        html += Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0])).map(([category, items]) => `
            <div class="category-header collapsed" data-category="${category}">
                <h2 class="category-title">${category}</h2>
                <i class="fas fa-chevron-down category-toggle-icon"></i>
            </div>
            <div class="products-container collapsed" data-category-content="${category}">
                ${items.map(createProductCardHTML).join('')}
            </div>
        `).join('');

        elements.productListDiv.innerHTML = html || "<p>No products found. Add products in Settings.</p>";
    };
    
    // --- HISTORY FUNCTIONS ---
    const getFilteredHistory = () => {
        const history = getHistory();
        const startDate = elements.startDateFilter.value ? new Date(elements.startDateFilter.value).setHours(0,0,0,0) : null;
        const endDate = elements.endDateFilter.value ? new Date(elements.endDateFilter.value).setHours(23,59,59,999) : null;
        
        return history.filter(item => {
            const itemDate = new Date(item.date);
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            return true;
        });
    }

    const displayHistory = () => {
        const filteredHistory = getFilteredHistory();
        elements.historyListDiv.innerHTML = filteredHistory.length === 0 ? '<p class="text-center">No records for selected dates.</p>' : filteredHistory.map(item => {
            const totalCrates = item.items.filter(i => i.container === 'crate').reduce((sum, i) => sum + i.quantity, 0);
            return `
            <div class="history-list-item">
                <input type="checkbox" class="history-checkbox" data-date="${item.date}">
                <div>
                    <span>${new Date(item.date).toLocaleDateString('en-GB')}</span>
                    <small style="display: block; opacity: 0.7;">${new Date(item.date).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</small>
                </div>
                <div>
                    <strong>₹ ${item.total.toFixed(2)}</strong>
                    ${totalCrates > 0 ? `<small style="display: block; opacity: 0.7;">Crates: ${totalCrates.toFixed(1)}</small>` : ''}
                </div>
                <button class="view-order-btn" data-date="${item.date}">View</button>
            </div>`;
        }).join('');
    };
    
    // --- ANALYTICS FUNCTIONS ---
    const destroyCharts = () => {
        Object.values(charts).forEach(chart => chart.destroy());
        charts = {};
    };

    const renderChart = (canvasId, type, data, options) => {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }
        charts[canvasId] = new Chart(ctx, { type, data, options });
    };

    const displayAnalytics = () => {
        destroyCharts();
        const monthYear = elements.analyticsMonthFilter.value;
        if (!monthYear) {
            elements.analyticsContent.innerHTML = `<p class="text-center">Select a month and click 'Generate'.</p>`;
            elements.downloadAnalyticsPdfBtn.classList.add('hidden');
            return;
        }

        const [year, month] = monthYear.split('-').map(Number);
        const history = getHistory();
        const filtered = history.filter(order => {
            const d = new Date(order.date);
            return d.getFullYear() === year && d.getMonth() + 1 === month;
        });

        if (filtered.length === 0) {
            elements.analyticsContent.innerHTML = `<p class="text-center">No data found for the selected month.</p>`;
            elements.downloadAnalyticsPdfBtn.classList.add('hidden');
            return;
        }

        // 1. Total Sales
        const totalSales = filtered.reduce((sum, order) => sum + order.total, 0);

        // 2. Top Selling Products
        const productSales = {};
        filtered.forEach(order => {
            order.items.forEach(item => {
                const product = allProducts.find(p => p.id === item.id);
                const name = product ? `${product.name} ${product.size}` : 'Unknown';
                productSales[name] = (productSales[name] || 0) + (item.quantity * item.price);
            });
        });
        const topProducts = Object.entries(productSales).sort((a,b) => b[1] - a[1]).slice(0, 5);
        
        // 3. Day-wise Sales
        const salesByDay = {};
        for(let i = 1; i <= new Date(year, month, 0).getDate(); i++) salesByDay[i] = 0; // pre-fill days
        filtered.forEach(order => {
            const day = new Date(order.date).getDate();
            salesByDay[day] = (salesByDay[day] || 0) + order.total;
        });

        elements.analyticsContent.innerHTML = `
            <div class="analytics-item"><h4>Total Sales</h4><p style="font-size: 1.5rem; font-weight: bold;">₹ ${totalSales.toFixed(2)}</p></div>
            <div class="analytics-item"><h4>Top 5 Selling Products (by Value)</h4><canvas id="topProductsChart"></canvas></div>
            <div class="analytics-item"><h4>Day-wise Sales Graph</h4><canvas id="dayWiseSalesChart"></canvas></div>
        `;
        
        renderChart('topProductsChart', 'bar', {
            labels: topProducts.map(p => p[0]),
            datasets: [{ label: 'Sales (₹)', data: topProducts.map(p => p[1].toFixed(2)), backgroundColor: '#0066cc' }]
        }, { responsive: true, indexAxis: 'y' });
        
        renderChart('dayWiseSalesChart', 'line', {
            labels: Object.keys(salesByDay),
            datasets: [{ label: 'Sales (₹)', data: Object.values(salesByDay), backgroundColor: '#d9232a', borderColor: '#d9232a', fill: false, tension: 0.1 }]
        }, { responsive: true });

        elements.downloadAnalyticsPdfBtn.classList.remove('hidden');
    };

    // --- DOWNLOAD FUNCTIONS ---
    // CHANGE #1: Heavily modified download function for better PDF output
    const downloadData = async () => {
        const format = document.querySelector('input[name="download-format"]:checked').value;
        const filteredHistory = getFilteredHistory();
        if (filteredHistory.length === 0) return showToast("No filtered data to download.");
        
        const startDate = elements.startDateFilter.value;
        const endDate = elements.endDateFilter.value;
        const dateString = `${startDate}_to_${endDate}`;
        
        switch(format) {
            case 'image':
                try {
                    const canvas = await html2canvas(elements.historyListDiv);
                    const link = document.createElement('a');
                    link.download = `Amul_History_${dateString}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                } catch(e) { console.error(e); showToast("Failed to generate image."); }
                break;
            case 'pdf':
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    doc.setFontSize(18);
                    doc.text("Amul Sales History", 105, 20, { align: 'center' });
                    doc.setFontSize(12);
                    doc.text(`Date Range: ${startDate} to ${endDate}`, 105, 30, { align: 'center' });
                    
                    let y = 45;
                    doc.setFont('helvetica', 'bold');
                    doc.text("Date & Time", 10, y);
                    doc.text("Crates", 100, y);
                    doc.text("Total (Rs)", 130, y);
                    doc.text("Items", 160, y);
                    doc.setFont('helvetica', 'normal');
                    y += 3;
                    doc.line(10, y, 200, y); // horizontal line
                    y += 7;

                    let grandTotal = 0;
                    let grandCrates = 0;

                    filteredHistory.forEach(order => {
                        const totalCrates = order.items.filter(i => i.container === 'crate').reduce((sum, i) => sum + i.quantity, 0);
                        const date = new Date(order.date).toLocaleString('en-GB');
                        const itemsStr = order.items
                            .map(item => {
                                const product = allProducts.find(p => p.id === item.id);
                                const name = product ? `${product.name.substring(0, 10)}...` : 'Unknown';
                                return `${item.quantity}x ${name}`;
                            })
                            .join(', ');

                        const shortItemsStr = itemsStr.length > 30 ? itemsStr.substring(0, 30) + '...' : itemsStr;
                        
                        doc.text(date, 10, y);
                        doc.text(totalCrates.toFixed(1), 100, y);
                        doc.text(order.total.toFixed(2), 130, y);
                        doc.setFontSize(10);
                        doc.text(shortItemsStr, 160, y, { maxWidth: 40 });
                        doc.setFontSize(12);
                        
                        grandTotal += order.total;
                        grandCrates += totalCrates;
                        y += 15; // Increased spacing
                         if (y > 270) { // Page break
                            doc.addPage();
                            y = 20;
                            doc.setFont('helvetica', 'bold');
                            doc.text("Date & Time", 10, y);
                            doc.text("Crates", 100, y);
                            doc.text("Total (Rs)", 130, y);
                            doc.text("Items", 160, y);
                            doc.setFont('helvetica', 'normal');
                            y += 3;
                            doc.line(10, y, 200, y);
                            y += 7;
                         }
                    });

                    // Add Summary
                    y += 5;
                    doc.line(10, y, 200, y);
                    y += 10;
                    doc.setFont('helvetica', 'bold');
                    doc.text("Total Crates:", 70, y);
                    doc.text(grandCrates.toFixed(1), 100, y);
                    doc.text("Grand Total:", 100, y + 10);
                    doc.text(`Rs ${grandTotal.toFixed(2)}`, 130, y + 10);

                    doc.save(`Amul_History_${dateString}.pdf`);
                } catch(e) { console.error(e); showToast("Failed to generate PDF."); }
                break;
            case 'csv':
                let csvContent = "Date,Total Amount,Total Crates,Products\n";
                filteredHistory.forEach(order => {
                    const totalCrates = order.items.filter(i => i.container === 'crate').reduce((sum, i) => sum + i.quantity, 0);
                    const date = new Date(order.date).toLocaleString('en-GB');
                    const total = order.total.toFixed(2);
                    const productsStr = order.items.map(item => {
                        const product = allProducts.find(p => p.id === item.id);
                        const name = product ? `${product.name}-${product.size}` : 'Unknown';
                        return `${item.quantity} x ${name}`;
                    }).join('; ');
                    csvContent += `"${date}",${total},${totalCrates.toFixed(1)},"${productsStr}"\n`;
                });
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `Amul_History_${dateString}.csv`;
                link.click();
                break;
        }
    };
    
    // --- SETTINGS FUNCTIONS ---
    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        elements.themeIcon.className = `fas fa-${theme === 'dark' ? 'sun' : 'moon'}`;
    };

    const displayManageProducts = () => {
        const products = getProducts();
        // CHANGE #4: Added edit button
        elements.manageProductListDiv.innerHTML = products.map(p => `
            <div class="managed-product-item" data-id="${p.id}">
                <span>${p.name} - ${p.size} (₹${p.price}) [${p.container}]</span>
                <div>
                    <button class="edit-product-btn" data-id="${p.id}"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-product-btn" data-id="${p.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    };

    const exportData = () => {
        const data = {
            products: getProducts(),
            history: getHistory()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `AmulCalc_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        showToast("Data exported!");
    };
    
    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.products && data.history) {
                    if (confirm("This will overwrite all current data. Continue?")) {
                        saveProducts(data.products);
                        saveHistory(data.history);
                        initializeApp();
                        showToast("Data imported successfully!");
                    }
                } else {
                    showToast("Invalid backup file.");
                }
            } catch (error) {
                showToast("Error reading file.");
                console.error(error);
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset file input
    };

    // --- EVENT HANDLERS ---
    elements.productListDiv.addEventListener('click', e => {
        const card = e.target.closest('.product-card');
        if (!card) { // Handle category header clicks
            if (e.target.closest('.category-header')) {
                const header = e.target.closest('.category-header');
                const content = document.querySelector(`.products-container[data-category-content="${header.dataset.category}"]`);
                header.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            }
            return;
        }

        if (e.target.closest('.quantity-btn')) {
            const quantityInput = card.querySelector('.quantity-display');
            // CHANGE #7: Use parseFloat for +/- buttons
            let quantity = parseFloat(quantityInput.value) || 0;
            if (e.target.closest('.plus-btn')) {
                quantity++;
            } else if (e.target.closest('.minus-btn')) {
                quantity--;
            }
            if (quantity < 0) quantity = 0; // Don't go below 0
            quantityInput.value = quantity;
            if (elements.autoCalculateToggle.checked) calculateTotal();
        } else if (e.target.classList.contains('quantity-display')) {
             e.target.select();
        }
    });

    elements.productListDiv.addEventListener('dblclick', e => {
        const card = e.target.closest('.product-card');
        if (card) {
            const quantityInput = card.querySelector('.quantity-display');
            quantityInput.focus();
            quantityInput.select();
        }
    });

    elements.productListDiv.addEventListener('input', e => {
         if(e.target.classList.contains('quantity-display') && elements.autoCalculateToggle.checked) {
            calculateTotal();
         }
    });

    elements.productListDiv.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('quantity-display')) {
            e.preventDefault();
            const allInputs = Array.from(document.querySelectorAll('.product-card:not([style*="display: none"]) .quantity-display'));
            const currentIndex = allInputs.indexOf(e.target);
            const nextInput = allInputs[currentIndex + 1];
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            } else {
                elements.saveBtn.focus(); // Focus save button on last item
            }
        }
    });

    elements.searchInput.addEventListener('input', () => {
        const searchTerm = elements.searchInput.value.toLowerCase();
        elements.searchClearBtn.classList.toggle('hidden', searchTerm.length === 0);
        document.querySelectorAll('.product-card').forEach(card => {
            card.style.display = card.dataset.name.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
        });
        if (elements.autoCalculateToggle.checked) calculateTotal();
    });
    
    elements.searchClearBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.searchInput.dispatchEvent(new Event('input')); // Trigger the input event
        elements.searchInput.focus();
    });
    
    elements.loadLastOrderBtn.addEventListener('click', () => {
        const history = getHistory();
        if (history.length === 0) return showToast("No saved orders!");
        
        const lastOrder = history[0];
        resetQuantities(); // Reset first
        document.querySelectorAll('.product-card').forEach(card => {
            const item = lastOrder.items.find(i => i.id === card.dataset.id);
            if(item) {
                card.querySelector('.quantity-display').value = item.quantity;
            }
        });
        calculateTotal();
        showToast("Last order loaded!");
    });

    elements.historyBtn.addEventListener('click', () => {
         elements.startDateFilter.value = '';
         elements.endDateFilter.value = '';
         displayHistory();
         elements.historyModal.classList.add('visible');
    });

    elements.applyFilterBtn.addEventListener('click', displayHistory);
    
    // CHANGE #1: New download button logic
    elements.downloadBtn.addEventListener('click', () => {
        const startDate = elements.startDateFilter.value;
        const endDate = elements.endDateFilter.value;
        if (!startDate || !endDate) {
            showToast("Please select a start and end date first.");
            return;
        }
        downloadData(); // This function now uses the new improved logic
    });

    elements.selectAllHistoryBtn.addEventListener('click', (e) => {
        const checkboxes = elements.historyListDiv.querySelectorAll('.history-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        e.target.textContent = allChecked ? 'Select All' : 'Deselect All';
    });
    
    elements.deleteSelectedHistoryBtn.addEventListener('click', () => {
        const checkedBoxes = elements.historyListDiv.querySelectorAll('.history-checkbox:checked');
        if (checkedBoxes.length === 0) return showToast("No items selected.");
        if (!confirm(`Delete ${checkedBoxes.length} record(s)?`)) return;

        const datesToDelete = new Set(Array.from(checkedBoxes).map(cb => cb.dataset.date));
        let history = getHistory();
        history = history.filter(item => !datesToDelete.has(item.date));
        saveHistory(history);
        showToast(`${checkedBoxes.length} record(s) deleted.`);
        displayHistory();
    });

    elements.historyListDiv.addEventListener('click', e => {
        if(e.target.classList.contains('view-order-btn')) {
            const date = e.target.dataset.date;
            const order = getHistory().find(h => h.date === date);
            if (!order) return;
            
            elements.orderDetailsListDiv.innerHTML = order.items.map(item => {
                 const product = allProducts.find(p => p.id === item.id);
                 const name = product ? `${product.name} - ${product.size}` : 'Unknown Product';
                 const price = item.price; // Use saved price
                 const itemTotal = (item.quantity * price).toFixed(2);
                 return `<div class="order-detail-item">
                            <span>${item.quantity} x ${name} (@ ₹${price.toFixed(2)})</span> 
                            <span>₹${itemTotal}</span>
                        </div>`;
            }).join('') + `<div class="order-detail-item" style="font-weight: bold; margin-top: 1rem; border-top: 1px solid var(--history-border-color); padding-top: 0.5rem;">
                            <span>Total:</span>
                            <span>₹ ${order.total.toFixed(2)}</span>
                          </div>`;
            elements.orderDetailsModal.classList.add('visible');
        }
    });

    elements.saveBtn.addEventListener('click', () => {
        const { total, crateCount } = calculateTotal();
        if (total <= 0) return;

        const items = Array.from(document.querySelectorAll('.product-card')).map(card => ({
            id: card.dataset.id,
            price: parseFloat(card.dataset.price),
            // CHANGE #7: Use parseFloat when saving
            quantity: parseFloat(card.querySelector('.quantity-display').value) || 0,
            container: card.dataset.container
        })).filter(item => item.quantity > 0);

        if (items.length === 0) return;

        let history = getHistory();
        history.push({ date: new Date().toISOString(), total, items });
        saveHistory(history);
        showToast("Order Saved & Reset successfully!");
        resetQuantities();
        displayProducts(); // Refresh to update My Order
    });

    // CHANGE #2: Added confirmation to Reset button
    elements.resetBtn.addEventListener('click', () => {
        const { total } = calculateTotal();
        if (total <= 0) return; // Don't ask if already zero
        
        if (confirm("Are you sure you want to reset the current order?")) {
            resetQuantities();
            showToast("Reset successfully!");
        }
    });
    
    // Settings & Data Management
    elements.settingsBtn.addEventListener('click', () => {
        displayManageProducts();
        elements.settingsModal.classList.add('visible');
    });
    elements.themeToggleBtn.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        saveTheme(newTheme);
        applyTheme(newTheme);
    });
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importFileInput.addEventListener('change', importData);

    elements.addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const products = getProducts();
        const newProduct = {
            id: `custom_${new Date().getTime()}`,
            name: document.getElementById('product-name').value.trim(),
            size: document.getElementById('product-size').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value.trim(),
            container: document.querySelector('input[name="container-type"]:checked').value,
        };
        products.push(newProduct);
        saveProducts(products);
        displayProducts();
        displayManageProducts();
        elements.addProductForm.reset();
        showToast("Product added!");
    });

    // CHANGE #4: Updated listener to handle both Edit and Delete
    elements.manageProductListDiv.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-product-btn');
        const editBtn = e.target.closest('.edit-product-btn');

        if (deleteBtn) {
            if (confirm("Delete this product?")) {
                let products = getProducts();
                products = products.filter(p => p.id !== deleteBtn.dataset.id);
                saveProducts(products);
                displayProducts();
                displayManageProducts();
                showToast("Product deleted!");
            }
        } else if (editBtn) {
            const productId = editBtn.dataset.id;
            const products = getProducts();
            const productToEdit = products.find(p => p.id === productId);
            
            if (productToEdit) {
                // Populate the edit modal
                document.getElementById('edit-product-id').value = productToEdit.id;
                document.getElementById('edit-product-name').value = productToEdit.name;
                document.getElementById('edit-product-size').value = productToEdit.size;
                document.getElementById('edit-product-price').value = productToEdit.price;
                document.getElementById('edit-product-category').value = productToEdit.category;
                document.querySelector(`input[name="edit-container-type"][value="${productToEdit.container}"]`).checked = true;
                
                elements.editProductModal.classList.add('visible');
            }
        }
    });

    // CHANGE #4: Add listener for saving the edit form
    elements.editProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedProduct = {
            id: document.getElementById('edit-product-id').value,
            name: document.getElementById('edit-product-name').value.trim(),
            size: document.getElementById('edit-product-size').value.trim(),
            price: parseFloat(document.getElementById('edit-product-price').value),
            category: document.getElementById('edit-product-category').value.trim(),
            container: document.querySelector('input[name="edit-container-type"]:checked').value,
        };

        let products = getProducts();
        const productIndex = products.findIndex(p => p.id === updatedProduct.id);
        
        if (productIndex > -1) {
            products[productIndex] = updatedProduct;
            saveProducts(products);
            displayProducts();
            displayManageProducts();
            elements.editProductModal.classList.remove('visible');
            showToast("Product updated!");
        } else {
            showToast("Error updating product.");
        }
    });


    // --- ANALYTICS MODAL LOGIC ---
    elements.modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.modalTabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
    elements.runAnalyticsBtn.addEventListener('click', displayAnalytics);
    elements.downloadAnalyticsPdfBtn.addEventListener('click', async () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt', 'a4');
            const canvas = await html2canvas(elements.analyticsContent);
            const imgData = canvas.toDataURL('image/png');
            const imgProps= doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            doc.save(`Amul_Analytics_${elements.analyticsMonthFilter.value}.pdf`);
        } catch(e) {
            console.error(e);
            showToast("Failed to generate PDF.");
        }
    });

    // --- TOGGLES & MODAL CLOSERS ---
    elements.autoCalculateToggle.addEventListener('change', () => {
        elements.calculateBtn.classList.toggle('hidden', elements.autoCalculateToggle.checked);
        if(elements.autoCalculateToggle.checked) calculateTotal();
    });
    elements.calculateBtn.addEventListener('click', calculateTotal);
    elements.closeHistoryBtn.addEventListener('click', () => elements.historyModal.classList.remove('visible'));
    elements.closeOrderDetailsBtn.addEventListener('click', () => elements.orderDetailsModal.classList.remove('visible'));
    elements.closeSettingsBtn.addEventListener('click', () => elements.settingsModal.classList.remove('visible'));
    elements.closeEditProductBtn.addEventListener('click', () => elements.editProductModal.classList.remove('visible')); // CHANGE #4
    
    // --- INITIALIZATION ---
    const initializeApp = async () => {
        applyTheme(getTheme());
        let currentProducts = getProducts();
        if (currentProducts.length === 0) {
            try {
                const response = await fetch('products.json');
                const defaultProducts = await response.json();
                saveProducts(defaultProducts);
            } catch (error) {
                console.error("Failed to load initial products:", error);
            }
        }
        displayProducts();
        calculateTotal();
        elements.calculateBtn.classList.toggle('hidden', elements.autoCalculateToggle.checked);
        elements.analyticsMonthFilter.value = new Date().toISOString().slice(0, 7); // Default to current month
    };

    initializeApp();
});
