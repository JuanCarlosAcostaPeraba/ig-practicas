const PORT = 3000

let express = require('express')
let app = express()

app.use(express.static('public'))

app.get('/', function (request, response) {
	response.sendFile(__dirname + '/views/index_S7.html')
})

let listener = app.listen(PORT, function () {
	console.log(`Your app is in: http://localhost:${listener.address().port}`)
})
