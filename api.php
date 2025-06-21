<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "pos_system");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // บันทึกการขาย
    $total = $data['total'];
    $cash = $data['cash'];
    $change = $data['change'];
    $items = $data['items'];

    // แทรกข้อมูลการขายลงตาราง sales
    $stmt = $conn->prepare("INSERT INTO sales (total_amount, cash_received, change) VALUES (?, ?, ?)");
    $stmt->bind_param("ddd", $total, $cash, $change);
    $stmt->execute();
    $sale_id = $conn->insert_id;

    // แทรกข้อมูลรายละเอียดการขายลง sale_items
    foreach ($items as $item) {
        $pid = $item['id'];
        $qty = $item['qty'];
        $price = $item['price'];
        $stmt2 = $conn->prepare("INSERT INTO sale_items (sale_id, product_id, qty, price) VALUES (?, ?, ?, ?)");
        $stmt2->bind_param("iiid", $sale_id, $pid, $qty, $price);
        $stmt2->execute();
    }

    echo json_encode(["status" => "success"]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // ดึงรายการการขายทั้งหมด
    $result = $conn->query("SELECT * FROM sales ORDER BY sale_time DESC");
    $sales = [];

    while($row = $result->fetch_assoc()) {
        $sale_id = $row['sale_id'];
        $items = [];
        $res_items = $conn->query("SELECT p.name, i.qty, i.price FROM sale_items i JOIN products p ON i.product_id = p.id WHERE i.sale_id = $sale_id");

        while($it = $res_items->fetch_assoc()) {
            $items[] = $it;
        }

        // สร้างใบเสร็จจากข้อมูล
        $row['items'] = $items;
        $row['receipt'] = generateReceipt($items, $row['total_amount'], $row['cash_received'], $row['sale_time']);
        $sales[] = $row;
    }

    echo json_encode($sales);
}

// สร้างข้อความใบเสร็จ
function generateReceipt($items, $total, $cash, $time) {
    $lines = array_map(function($i) {
        return sprintf("%-10s x%d = %6.2f บาท", $i['name'], $i['qty'], $i['price'] * $i['qty']);
    }, $items);

    return "[ร้านค้า XYZ]
วันที่: {$time}
-------------------------------------
" . implode("\n", $lines) . "
-------------------------------------
รวมทั้งหมด: {$total} บาท
รับเงิน: {$cash} บาท
เงินทอน: " . number_format($cash - $total, 2) . " บาท
ขอบคุณที่ใช้บริการ!";
}
?>