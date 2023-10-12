# User Resources

## Get user

### GET `/api/users/{userId}`

Busque por um usuário na API do Discord, retorna uma [estrutura](https://discord.com/developers/docs/resources/user#user-object) de usuário do Discord.

## Get user notifications

### GET `/api/users/{userId}/notifications`

Busque por todas as notificações de um usuário

#### Example Response Structure

```json
{
    "1": {
        "content": "Something goes here",
        "type": 0,
        "sent_at": 1697124907633
    },
    "2": {
        "content": "Other words here",
        "type": 0,
        "sent_at": 1697125062370
    }
}
```

## Delete a notification

### DELETE `/api/users/{userId}/notifications/{notificationId}`

Delete uma notificação de um usuário, retorna uma resposta vazia

## Create a notification

### POST `/api/users/{userId}/notifications`

Crie uma nova notificação, retorna todas as notificações do usuário

#### JSON Params

| FIELD   | TYPE    | DESCRIPTION                     |
| ------- | ------- | ------------------------------- |
| content | string  | O conteúdo/corpo da notificação |
| type    | integer | O tipo da notificação           |