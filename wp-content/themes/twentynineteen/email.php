<?php
// Get data
$customer_name = $_POST[“customer_name”];
$customer_email = $_POST[“customer_email”];
$customer_sex = $_POST[“customer_sex”];
$customer_age = $_POST[“customer_age”];// Database connection
$conn = mysqli_connect(“Database Host”,”Database Username”,”Database Password”,”Database Name”);
if(!$conn) {
die(‘Problem in database connection: ‘ . mysql_error());
}// Data insertion into database
$query = “INSERT INTO ‘Database Name’.’Table Name’ ( ‘customer_name’, ‘customer_email’, ‘customer_sex’, ‘customer_age’ ) VALUES ( $customer_name, $customer_email, $customer_sex, $customer_age )”;
mysqli_query($conn, $query);// Redirection to the success page
header(“Location: “);
?>