// สินค้าพร้อมรูป
const products = [
    { id: 1, name: "กาแฟ", price: 35, image: "images/เสือนอนกิน.jpg" },
    { id: 2, name: "ชาเขียวเย็น", price: 40, image: "images/เสือนอนกิน.jpg" },
    { id: 3, name: "โกโก้เย็น", price: 45, image: "images/เสือนอนกิน.jpg" },
    { id: 4, name: "ขนมปัง", price: 20, image: "images/เสือนอนกิน.jpg" },
    { id: 5, name: "น้ำเปล่า", price: 15, image: "images/เสือนอนกิน.jpg" },
];
let cart = [];

// โหลดสินค้า
function loadProducts() {
    const container = document.getElementById("product-list");
    if (!container) return;
    container.innerHTML = "";
    products.forEach(product => {
        const div = document.createElement("div");
        div.className = "product-item";
        div.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-details">
                ${product.name} - ${product.price} บาท<br>
                <input type="number" id="qty-${product.id}" value="1" min="1" style="width:50px;">
                <button onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> เพิ่มลงตะกร้า</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// เพิ่มสินค้าลงตะกร้า
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const qtyInput = document.getElementById(`qty-${productId}`);
    const qty = parseInt(qtyInput.value);
    if (isNaN(qty) || qty <= 0) {
        alert("กรุณากรอกจำนวนสินค้าให้ถูกต้อง!");
        return;
    }
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }
    renderCart();
}

// แสดงตะกร้า
function renderCart() {
    const tbody = document.querySelector("#cart-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    let total = 0;
    cart.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>${item.price * item.qty}</td>
        `;
        tbody.appendChild(tr);
        total += item.price * item.qty;
    });
    document.getElementById("total").textContent = total;
}

// ฟังก์ชันรับเงิน
function addDigit(digit) {
    const input = document.getElementById("cash-display");
    if (input.value === "0") {
        input.value = digit;
    } else {
        input.value += digit;
    }
}
function clearCash() {
    document.getElementById("cash-display").value = "0";
}
function backspace() {
    const input = document.getElementById("cash-display");
    if (input.value.length > 1) {
        input.value = input.value.slice(0, -1);
    } else {
        input.value = "0";
    }
}

// ชำระเงิน + บันทึกประวัติการขาย
function checkout() {
    if (cart.length === 0) {
        alert("กรุณาเลือกสินค้าก่อนชำระเงิน!");
        return;
    }

    const totalAmount = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const cashReceived = parseFloat(document.getElementById("cash-display").value);

    if (isNaN(cashReceived) || cashReceived < totalAmount) {
        alert("กรุณาระบุจำนวนเงินให้ถูกต้อง!");
        return;
    }

    const change = cashReceived - totalAmount;

    // สร้างข้อมูลการขาย
    const saleData = {
        name: cart.map(i => i.name).join(", "),
        quantity: cart.map(i => i.qty).reduce((a,b)=>a+b, 0),
        price: cart.map(i => i.price).join(", "),
        time: new Date().toLocaleString(),
        total: totalAmount,
        payment: cashReceived,
        change: change.toFixed(2)
    };

    // บันทึกประวัติการขายลง localStorage
    saveSaleToHistory(saleData);

    // แสดงเงินทอน
    document.getElementById("change-result").innerHTML =
        `<strong>เงินทอน:</strong> ${change.toFixed(2)} บาท`;

    // แสดงป็อปอัป
    showPopup(totalAmount, cashReceived, change);

    // เคลียร์ตะกร้า
    cart = [];
    clearCash();
    renderCart();
}

// ฟังก์ชันแสดงป็อปอัป
function showPopup(totalAmount, cashReceived, changeAmount) {
    document.getElementById("popup-total").textContent = `ยอดรวม: ${totalAmount.toFixed(2)} บาท`;
    document.getElementById("popup-received").textContent = `รับเงิน: ${cashReceived.toFixed(2)} บาท`;
    document.getElementById("popup-change").textContent = `เงินทอน: ${changeAmount.toFixed(2)} บาท`;
    const popup = document.getElementById("success-popup");
    popup.classList.add("show");

    setTimeout(() => {
        closePopup();
    }, 5000);
}

// ปิดป็อปอัป
function closePopup() {
    const popup = document.getElementById("success-popup");
    popup.classList.remove("show");

    // เคลียร์ตะกร้าและข้อมูลการแสดงผล
    cart = [];
    clearCash();
    renderCart();
    document.getElementById("change-result").innerHTML = "";
}

// ฟังก์ชันบันทึกประวัติการขายลง localStorage + รันเลขใบเสร็จ
function saveSaleToHistory(data) {
    let sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const receiptNo = sales.length > 0 ? sales[0].receiptNo + 1 : 1;
    const saleData = {
        receiptNo: receiptNo,
        ...data,
        date: data.time.split(',')[0]
    };
    sales.unshift(saleData);
    localStorage.setItem('sales', JSON.stringify(sales));
}

// โหลดประวัติการขายที่หน้า index.html
function loadSalesHistoryOnIndex() {
    const container = document.getElementById("history-body");
    if (!container) return;
    container.innerHTML = "";
    const sales = JSON.parse(localStorage.getItem("sales") || "[]");

    if (sales.length === 0) {
        container.innerHTML = "<tr><td colspan='5'>ไม่มีข้อมูล</td></tr>";
        return;
    }

    sales.slice(0, 5).forEach((sale) => {
        const row = `
            <tr>
                <td>${sale.time}</td>
                <td>${sale.total}</td>
                <td>${sale.payment}</td>
                <td>${sale.change}</td>
                <td><button onclick="viewReceipt()">ดู</button></td>
            </tr>
        `;
        container.innerHTML += row;
    });
}

// โหลดประวัติการขายเต็มรูปแบบที่หน้า history.html
function loadFullSalesHistory(all = true) {
    const container = document.getElementById("sales-history");
    if (!container) return;
    container.innerHTML = "";
    const sales = JSON.parse(localStorage.getItem("sales") || "[]");

    let displaySales = all ? sales : sales.filter(sale => {
        const today = new Date().toLocaleDateString("th-TH");
        const saleDate = sale.time.split(',')[0];
        return saleDate === today;
    });

    if (displaySales.length === 0) {
        container.innerHTML = "<p>ไม่มีข้อมูล</p>";
        return;
    }

    displaySales.forEach((sale, index) => {
        const div = `
            <div class="sale-item">
                <h3>ใบเสร็จ #${sale.receiptNo}</h3>
                <p><strong>ชื่อสินค้า:</strong> ${sale.name}</p>
                <p><strong>จำนวน:</strong> ${sale.quantity}</p>
                <p><strong>ราคา:</strong> ${sale.price}</p>
                <p><strong>เวลา:</strong> ${sale.time}</p>
                <p><strong>ยอดรวม:</strong> ${parseFloat(sale.total).toFixed(2)} บาท</p>
                <p><strong>รับเงิน:</strong> ${parseFloat(sale.payment).toFixed(2)} บาท</p>
                <p><strong>เงินทอน:</strong> ${parseFloat(sale.change).toFixed(2)} บาท</p>
                <button onclick="deleteSale(${index})" style="background-color: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 5px;">🗑️ ลบ</button>
                <hr/>
            </div>
        `;
        container.innerHTML += div;
    });

    // ปุ่มลบทั้งหมด
    const deleteAllBtn = document.getElementById("delete-all-btn");
    if (deleteAllBtn) {
        deleteAllBtn.onclick = deleteAllSales;
    }

    // แสดงสรุปยอดขายรายวัน
    renderDailySummary();
}

// ลบข้อมูลแต่ละรายการ
function deleteSale(index) {
    let sales = JSON.parse(localStorage.getItem("sales") || "[]");
    if (confirm("ยืนยันการลบรายการนี้?")) {
        sales.splice(index, 1);
        localStorage.setItem("sales", JSON.stringify(sales));
        loadFullSalesHistory(true); // อัปเดตการแสดงผล
    }
}

// ลบข้อมูลทั้งหมด
function deleteAllSales() {
    if (confirm("คุณต้องการลบข้อมูลทั้งหมดใช่ไหม?")) {
        localStorage.removeItem("sales");
        loadFullSalesHistory(); // อัปเดตการแสดงผล
    }
}

// สรุปยอดขายรายวัน
function renderDailySummary() {
    const sales = JSON.parse(localStorage.getItem("sales") || "[]");
    const dailySummary = {};
    sales.forEach(sale => {
        const date = sale.date;
        if (!dailySummary[date]) {
            dailySummary[date] = { count: 0, total: 0 };
        }
        dailySummary[date].count += 1;
        dailySummary[date].total += parseFloat(sale.total);
    });

    const summaryContainer = document.getElementById("daily-summary");
    summaryContainer.innerHTML = "";

    if (Object.keys(dailySummary).length === 0) {
        summaryContainer.innerHTML = "<p>ไม่มียอดขาย</p>";
        return;
    }

    for (const date in dailySummary) {
        summaryContainer.innerHTML += `
            <div class="summary-item">
                <strong>วันที่:</strong> ${date} |
                <strong>จำนวนรายการ:</strong> ${dailySummary[date].count} |
                <strong>ยอดรวม:</strong> ${dailySummary[date].total.toFixed(2)} บาท
            </div>
        `;
    }
}

// โหลดใบเสร็จที่หน้า receipt.html
function loadReceipts() {
    const container = document.getElementById("receipt-list");
    if (!container) return;
    container.innerHTML = "";
    const sales = JSON.parse(localStorage.getItem("sales") || "[]");

    if (sales.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>ไม่มีข้อมูลใบเสร็จ</p>";
        return;
    }

    sales.forEach((sale, index) => {
        const div = `
            <div class="receipt-box">
                <h3>ใบเสร็จ #${sale.receiptNo}</h3>
                <p>ชื่อสินค้า: ${sale.name}</p>
                <p>จำนวน: ${sale.quantity}</p>
                <p>ราคา/ชิ้น: ${sale.price}</p>
                <p>รวมทั้งหมด: ${parseFloat(sale.total).toFixed(2)} บาท</p>
                <p>รับเงิน: ${parseFloat(sale.payment).toFixed(2)} บาท</p>
                <p>เงินทอน: ${parseFloat(sale.change).toFixed(2)} บาท</p>
                <p>เวลา: ${sale.time}</p>
                <button onclick="printReceipt(${index})">🖨️ พิมพ์ใบเสร็จนี้</button>
                <hr/>
            </div>
        `;
        container.innerHTML += div;
    });

    // ปุ่มลบทั้งหมดใน receipt.html
    const deleteAllBtn = document.getElementById("delete-all-btn");
    if (deleteAllBtn) {
        deleteAllBtn.onclick = deleteAllSales;
    }
}

// พิมพ์ใบเสร็จแต่ละรายการ
function printReceipt(index) {
    const sales = JSON.parse(localStorage.getItem("sales")) || [];
    const sale = sales[index];

    if (!sale) {
        alert("ไม่พบข้อมูลใบเสร็จนี้");
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head><title>พิมพ์ใบเสร็จ</title></head>
        <body onload="window.print(); window.close()">
            <pre style="font-size:14px; font-family:monospace;">
[ร้านค้า ชิกชิกเก้นฉีก]
วันที่: ${sale.time}
-------------------------------------
ชื่อสินค้า: ${sale.name}
จำนวน: ${sale.quantity}
ราคาต่อหน่วย: ${sale.price}
รวมทั้งหมด: ${parseFloat(sale.total).toFixed(2)} บาท
รับเงิน: ${parseFloat(sale.payment).toFixed(2)} บาท
เงินทอน: ${parseFloat(sale.change).toFixed(2)} บาท
ขอบคุณที่ใช้บริการ!
            </pre>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// เมนูแท็บ
function openTab(evt, tabName) {
    const tabs = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }
    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove("active");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

// เรียกเมื่อโหลดหน้า
window.onload = () => {
    loadProducts();
    loadSalesHistoryOnIndex();
    loadFullSalesHistory(true);
    loadReceipts();
};

// เสียงเมื่อกดปุ่ม
document.addEventListener("click", function(e) {
    if (e.target.tagName === "BUTTON") {
        const sound = document.getElementById("click-sound");
        if (sound) {
            sound.currentTime = 0;
            sound.play();
        }
    }
});

// Dark Mode
document.getElementById("dark-mode-toggle").addEventListener("change", function () {
    document.body.classList.toggle("dark-mode");
});

//ฟังก์ชันลบแต่ละรายการ
function deleteSale(index) {
    let sales = JSON.parse(localStorage.getItem("sales") || "[]");
    if (confirm("ยืนยันการลบรายการนี้?")) {
        sales.splice(index, 1);
        localStorage.setItem("sales", JSON.stringify(sales));
        loadFullSalesHistory(); // อัปเดตการแสดงผล
    }
}

//ฟังก์ชันลบทั้งหมด
function deleteAllSales() {
    if (confirm("คุณต้องการลบข้อมูลทั้งหมดใช่ไหม?")) {
        localStorage.removeItem("sales");
        loadFullSalesHistory(); // อัปเดตตารางประวัติการขาย
    }
}

//ฟังก์ชันโหลดประวัติการขายแบบเต็ม (แสดงปุ่มลบ)
function loadFullSalesHistory(all = true) {
    const container = document.getElementById("sales-history");
    if (!container) return;
    container.innerHTML = "";

    const sales = JSON.parse(localStorage.getItem("sales") || "[]");

    if (sales.length === 0) {
        container.innerHTML = "<p>ไม่มีข้อมูล</p>";
        return;
    }

    sales.forEach((sale, index) => {
        const div = `
            <div class="sale-item">
                <strong>ชื่อ:</strong> ${sale.name} <br>
                <strong>จำนวน:</strong> ${sale.quantity} <br>
                <strong>ราคา:</strong> ${sale.price} บาท <br>
                <strong>เวลา:</strong> ${sale.time} <br>
                <strong>ยอดรวม:</strong> ${parseFloat(sale.total).toFixed(2)} บาท <br>
                <strong>รับเงิน:</strong> ${parseFloat(sale.payment).toFixed(2)} บาท <br>
                <strong>เงินทอน:</strong> ${parseFloat(sale.change).toFixed(2)} บาท <br>
                <button onclick="deleteSale(${index})" style="background-color: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 5px;">🗑️ ลบ</button>
                <hr/>
            </div>
        `;
        container.innerHTML += div;
    });

    // ปุ่มลบทั้งหมด
    const deleteAllBtn = document.getElementById("delete-all-btn");
    if (deleteAllBtn) {
        deleteAllBtn.onclick = deleteAllSales;
    }

    renderDailySummary(); // สรุปยอดขายรายวัน
}

//ฟังก์ชัน saveSaleToHistory() — เพื่อบันทึกข้อมูลลง localStorage
function saveSaleToHistory(data) {
    let sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const receiptNo = sales.length > 0 ? sales[0].receiptNo + 1 : 1;
    const saleData = {
        receiptNo: receiptNo,
        ...data,
        date: data.time.split(',')[0]
    };
    sales.unshift(saleData);
    localStorage.setItem('sales', JSON.stringify(sales));
}
function renderDailySummary() {
    const sales = JSON.parse(localStorage.getItem("sales") || "[]");
    const dailySummary = {};
    let grandTotal = 0;

    sales.forEach(sale => {
        const date = sale.date;
        if (!dailySummary[date]) {
            dailySummary[date] = { count: 0, total: 0 };
        }
        dailySummary[date].count += 1;
        dailySummary[date].total += parseFloat(sale.total);
        grandTotal += parseFloat(sale.total);
    });

    const summaryContainer = document.getElementById("daily-summary");
    summaryContainer.innerHTML = "";

    if (Object.keys(dailySummary).length === 0) {
        summaryContainer.innerHTML = "<p>ไม่มียอดขาย</p>";
        return;
    }

    for (const date in dailySummary) {
        summaryContainer.innerHTML += `
            <div class="summary-item">
                <strong>วันที่:</strong> ${date} |
                <strong>จำนวนรายการ:</strong> ${dailySummary[date].count} |
                <strong>ยอดรวม:</strong> ${dailySummary[date].total.toFixed(2)} บาท
            </div>
        `;
    }

    // สรุปยอดขายทั้งหมด
    const totalSummaryContainer = document.getElementById("total-summary");
    totalSummaryContainer.innerHTML = `
        <div class="total-summary">
            <strong>สรุปยอดขายทั้งหมด:</strong> ${grandTotal.toFixed(2)} บาท
        </div>
    `;
}
function loadFullSalesHistory(all = true) {
    const container = document.getElementById("sales-history");
    if (!container) return;
    container.innerHTML = "";
    const sales = JSON.parse(localStorage.getItem("sales") || "[]");

    if (sales.length === 0) {
        container.innerHTML = "<tr><td colspan='9'>ไม่มีข้อมูล</td></tr>";
        renderDailySummary(); // แสดงผลสรุปแม้ไม่มีข้อมูล
        return;
    }

    sales.forEach((sale, index) => {
        const row = `
            <tr>
                <td>${sale.receiptNo}</td>
                <td>${sale.name}</td>
                <td>${sale.quantity}</td>
                <td>${sale.price}</td>
                <td>${sale.time}</td>
                <td>${parseFloat(sale.total).toFixed(2)}</td>
                <td>${parseFloat(sale.payment).toFixed(2)}</td>
                <td>${parseFloat(sale.change).toFixed(2)}</td>
                <td>
                    <button onclick="deleteSale(${index})"><i class="fas fa-trash"></i> ลบ</button>
                </td>
            </tr>
        `;
        container.innerHTML += row;
    });

    renderDailySummary(); // เรียกใช้งานหลังโหลดข้อมูล
}
window.onload = () => {
    loadProducts();
    loadSalesHistoryOnIndex();
    loadFullSalesHistory(true); // โหลดประวัติการขาย + สรุปยอดขาย
    loadReceipts();
};

// ลบข้อมูลแต่ละรายการ
function deleteSale(index) {
    let sales = JSON.parse(localStorage.getItem("sales") || "[]");
    if (confirm("ยืนยันการลบรายการนี้?")) {
        sales.splice(index, 1);
        localStorage.setItem("sales", JSON.stringify(sales));
        loadFullSalesHistory(); // อัปเดตการแสดงผล
    }
}

// ลบข้อมูลทั้งหมด
function deleteAllSales() {
    if (confirm("คุณต้องการลบข้อมูลทั้งหมดใช่ไหม?")) {
        localStorage.removeItem("sales");
        loadFullSalesHistory();
    }
}