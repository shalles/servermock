<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PHP page</title>
</head>
<body>
    <div><span>name:</span> <?php $name ?></div>
    <div><span>age:</span> <?php $age; ?></div>
    <?php echo "show your info";?>
    <br>
    <?php is_null($show): "default": $show;?>
</body>
</html>
