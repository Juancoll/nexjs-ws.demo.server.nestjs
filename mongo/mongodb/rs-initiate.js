var conf = {
	_id: "rs1",
	members: [{
		_id:0,
		host: "localhost:27017"
	}]
}

rs.initiate(conf);