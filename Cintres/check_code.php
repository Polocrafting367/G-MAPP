<?php
header('Content-Type: application/json');
$dataDir = __DIR__ . '/../data/0_Cintres';
$code = isset($_GET['code']) ? trim($_GET['code']) : '';
if ($code === '') {
    echo json_encode(["exists" => false, "message" => "Code vide"]);
    exit;
}
$filePath = $dataDir . '/' . $code . '.json';
echo json_encode(["exists" => file_exists($filePath)]);
?>
