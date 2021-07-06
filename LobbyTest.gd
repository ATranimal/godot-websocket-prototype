extends Node2D

# The URL we will connect to
export var websocket_url = "ws://127.0.0.1:8080"

var world_scene = preload("res://World.tscn");

# Our WebSocketClient instance
var _client = WebSocketClient.new()

var is_connected = false;

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
    $Button.text = "Start Game"

    var test_dict = {
        "msgCode": "0",
        "value": {
            "test": "test"
        }
    }
    _client.get_peer(1).put_packet(JSON.print(test_dict).to_utf8())

func _on_data():
    # Print the received packet, you MUST always use get_peer(1).get_packet
    # to receive data from server, and not get_packet directly when not
    # using the MultiplayerAPI.
    print("Got data from server: ", _client.get_peer(1).get_packet().get_string_from_utf8())

func _process(delta):
    _client.poll()

func _on_Button_pressed():
    if !is_connected:
        _attempt_connection()

func _attempt_connection():
    _client.connect("data_received", self, "_on_data")

    var err = _client.connect_to_url(websocket_url)
    if err != OK:
        print(err)
        print("Unable to connect")
        set_process(false)
