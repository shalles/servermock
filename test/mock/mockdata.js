function(req, res){
    // 对.js .css等重定向等redirect
    // res.statusCode = 302;
    // res.setHeader("Location", "http://127.0.0.1:8088" + req.url);
    // res.end();
    console.log("req:", req);
    console.log("res:", res);
    var data = {"errno":0,"data":[1,2,3,4,5,6,7,8,'a','b','c','d']};
    data['data'] = data['data'].slice(Math.random(1)*8)
    
    res.end(JSON.stringify(data));
}