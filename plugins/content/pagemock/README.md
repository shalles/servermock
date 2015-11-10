## page mock

### Directory

支持两种方式：<br>
1. 方式一： 与page同目录同名的.json或.mjson

builddir <br>
... <br>
--pagedir <br>
----page1.php <br>
----page1.json / page1.mjson <br>
----page2.vm <br>
----page2.json / page2.mjson <br>
----... <br>
--... <br>

2. 方式二： 在配置中指定到固定目录

```js
    basepath: "mock/page" //与mock插件同用的时候为了方便管理mock文件可与mock文件共用文件夹
```

### Config

sm.config

```js
{
    "plugins": [{
        "name": "pagemock",
        "open": true,
        "param": {
            "basepath": "mock/page",            //default: 与sm.config同级目录 可用绝对路径
            "mockrc": "../.mockrc",             //相对于basepath 可与mock同用.mockrc文件 可用绝对路径
            "acceptExts": ["php", "html", "vm"] //监听的页面扩展
        }
    ]
}
```


### Example

page1.php

```php
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
    <?php echo is_null($show): "default": $show;?>
    <div>
        <?php echo is_null($variable)? "": "<em>".$variable. "</em>元"; ?>
    </div>
</body>
</html>
```

#### page1.json

```json
{
    "$name": "shalles",
    "$age": 18,
    "show": null
}
```

#### page1.mjson

```json
{
    "name": "shalles",
    "age|18-20": 18,
    "show|0-1": "I will support php, python, jsp and so on"
}
```

**mjson的数据生成**<br>
如：<br>

1. `data|1-10` 随机生成 [1, 10]之间的value， value是数组就生成有[1，10]个元素的数组， value是数字(任意) -> [1,10]间的数字， value是字符串 -> [1, 10]个该字符串叠加<br>

2. 随机数组占位符 MNAME 在 .mockrc文件中配置 "MNAME": ["shalles", "东阳", "小明", "小梅", "乔治"]，可与1叠加使用，即有`token|3-3: @MNAME` 数组中给定的元素随机3个组合的字符串<br>

更多语法规范，请参考 [ http://mockjs.com/#语法规范 ] (http://mockjs.com/#语法规范)

#### .mockrc文件自定义mockjson随机变量

除了默认的还提供在.mockrc文件中自定义随机变量(*.mjson)

```json
{
    "MCITY":["北京", "上海", "广州", "深圳", "贵阳", "厦门", "成都"],
    "MNAME": ["shalles", "东阳", "小明", "小梅", "乔治"]
}
```

**[test demo](https://github.com/shalles/servermock/tree/master/test)**