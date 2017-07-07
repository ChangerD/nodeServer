var PORT = 3000;
var http = require('http');
var url = require('url');
var fs = require('fs');
var mine = require('./mine').types;
var path = require('path');
var livereload = require('livereload'); //livereload
var lrserver = livereload.createServer();
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({
    target:'http://192.168.2.129:8889/', //接口地址
    changeOrigin: true
    // 下面的设置用于https
    // ssl: {
    // key: fs.readFileSync('server_decrypt.key', 'utf8'),
    // cert: fs.readFileSync('server.crt', 'utf8')
    // },
    // secure: false
});
proxy.on('error', function(err, req, res) {
    res.writeHead(500, {
        'content-type': 'text/plain'
    });
    console.log(err);
    res.end('Something went wrong. And we are reporting a custom error message.');
});
proxy.on('close', function (res, socket, head) {
  // view disconnected websocket connections
  console.log('Client disconnected');
});
var server = http.createServer(function(request, response) {
    var pathname = url.parse(request.url).pathname;
    //var realPath = path.join("main-pages", pathname); // 指定根目录
    var realPath = path.join("www", pathname);
    console.log(pathname);
    console.log(realPath);
    var ext = path.extname(realPath);
    ext = ext ? ext.slice(1) : 'unknown';
    //判断如果是接口访问，则通过proxy转发
    console.log('-+-+-+-+—-=-=-=-='+request.url);
    //带.do或者固定目录的
    if (pathname.indexOf(".action") > 0) {
        console.log('开启代理');
        proxy.web(request, response);
        console.log('开启代理结束');
        return;
    }
    fs.exists(realPath, function(exists) {
        if (!exists) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write("This request URL " + pathname + " was not found on this server.");
            response.end();
        } else {
            if(fs.lstatSync(realPath).isDirectory()){//判断是不是文件夹
                // path.resolve(realPath);
                response.writeHead(404, {
                    'Content-Type': 'text/plain'
                });
                response.write("This request URL " + pathname + " was a directory on this server. Permission Denied !");
                response.end();
            }else{
                fs.readFile(realPath, "binary", function(err, file) {
                if (err) {
                    response.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    response.end(err);
                } else {
                    var contentType = mine[ext] || "text/plain";
                    response.writeHead(200, {
                        'Content-Type': contentType
                    });
                    response.write(file, "binary");
                    response.end();
                }
            });
            }
        }
    });
});
server.listen(PORT);
lrserver.watch("./www");
console.log("Server runing on at port: " + PORT + ".");
