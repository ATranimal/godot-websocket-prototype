extends TileMap

func _ready():
	init_tiles()

func init_tiles():
	for y in 8:
		for x in 8:
			set_cell(x, y, 5)
