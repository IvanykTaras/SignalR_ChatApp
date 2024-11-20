using System;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.SignalR;

namespace Server.Hubs;

public class ChatHub : Hub
{
    private readonly IDictionary<string, UserConnection> _connections;

    public ChatHub(IDictionary<string, UserConnection> connections)
    {
        _connections = connections;
    }

    public async Task JoinRoom(UserConnection userConnection){
        await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.Room);

        _connections[Context.ConnectionId] = userConnection;

        await Clients.Group(userConnection.Room).SendAsync("ReciveMessage", "User: " + userConnection.User, $"{userConnection.User} join room {userConnection.Room}" );
    
        await SendConnectedUsers(userConnection.Room);
    }

    public override async Task OnDisconnectedAsync(Exception exception){
        if(_connections.TryGetValue(Context.ConnectionId, out UserConnection userConnection)){
            await Clients.Group(userConnection.Room).SendAsync("ReciveMessage", "User: " + userConnection.User, $"{userConnection.User} leave room {userConnection.Room}" );
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userConnection.Room);
            _connections.Remove(Context.ConnectionId);

            await SendConnectedUsers(userConnection.Room);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string message){
           if(_connections.TryGetValue(Context.ConnectionId, out UserConnection userConnection)){
               await Clients.Group(userConnection.Room)
                .SendAsync("ReciveMessage", userConnection.User, message);
           }
    }

    public async Task SendConnectedUsers(string room){
        var users = _connections.Values.Where(e => e.Room == room).Select(e => e.User);
        await Clients.Group(room).SendAsync("UsersInRoom", users);
    }
}

public class UserConnection{
    public string User { get; set; }
    public string Room { get; set; }
}
