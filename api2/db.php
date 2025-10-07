<?php
$host = '127.0.0.1';
$user = 'root';
$password = '';
$database = 'smoothie_db';

$mysqli = mysqli_connect($host, $user, $password, $database, 3306);

if (mysqli_connect_errno()) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . mysqli_connect_error()]);
    exit;
}

// Set charset to UTF-8 for proper JSON handling
mysqli_set_charset($mysqli, 'utf8mb4');

function closeConnection($mysqli)
{
    mysqli_close($mysqli);
}
?>