extends Node2D

# The URL we will connect to
export var websocket_url = "ws://127.0.0.1:8080"

var world_scene = preload("res://World.tscn");

# Our WebSocketClient instance
var _client = WebSocketClient.new()

var is_connected = false;
var is_ready = false;

func _ready():
    # Connect base signals to get notified of connection open, close, and errors.
    _client.connect("connection_closed", self, "_closed")
    _client.connect("connection_error", self, "_closed")
    _client.connect("connection_established", self, "_connected")   
    # This signal is emitted when not using the Multiplayer API every time
    # a full packet is received.
    # Alternatively, you could check get_peer(1).get_available_packets() in a loop.


func _closed(was_clean = false):
    # was_clean will tell you if the disconnection was correctly notified
    # by the remote peer before closing the socket.
    print("Closed, clean: ", was_clean)
    set_process(false)

func _connected(proto = ""):
    print("Connected with protocol: ", proto)
    is_connected = true
    $Button.text = "Ready Game"

    # _client.get_peer(1).put_packet(JSON.print(test_dict).to_utf8())

func _on_data():
    var packet = _client.get_peer(1).get_packet().get_string_from_utf8()
    
    if packet == "playerReady":
        $Button.text = "Start Game"
        is_ready = true
    elif packet == "startGame":
        $Button.text = "Game Started"

func _process(delta):
    _client.poll()

func _on_Button_pressed():
    if !is_connected:
        _attempt_connection()
    else: 
        if !is_ready:
            _msg({
                "eventName": "playerReady",
                "body": null
            })
        else:
             _msg({
                "eventName": "startGame",
                "body": null
            })
            
func _msg(event: Dictionary):
    _client.get_peer(1).put_packet(JSON.print(event).to_utf8())

func _attempt_connection():
    _client.connect("data_received", self, "_on_data")

    var err = _client.connect_to_url(websocket_url)
    if err != OK:
        print(err)
        print("Unable to connect")
        set_process(false)
