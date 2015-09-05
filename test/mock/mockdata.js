function(req, res){
    console.log("req:", req);
    console.log("res:", res);
    var data = {"errno":0,"data":[1,2,3,4,5,6,7,8, 'a','b','c','d']}
    data.['data'] = data.['data'].slice(Math.random(1)*8)
    
    res.end(JSON.stringify(data));
}