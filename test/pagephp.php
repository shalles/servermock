<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PHP page mock</title>
</head>
<body>
    <h2>PHP page mock</h2>
    <div><span>name:</span> <?php echo $name ?></div>
    <div><span>age:</span> <?php echo $age; ?></div>
    <?php echo "show your info";?>
    <br>
    <?php echo is_null($show)? "default": $show;?>
</body>
</html>
