# StartPushLivechat
App to start a [Push](https://push.al/) flow for a livechat room

## Installation

### Prerequisites

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node](https://nodejs.org/en/download/)
- [RC-Apps](https://docs.rocket.chat/apps-development/getting-started#rocket-chat-app-engine-cli)

1. Clone the repository and change directory:

```bash
    git clone https://github.com/Ilhasoft/RCApps.StartPushLivechat.git
    cd RCApps.StartPushLivechat
```

2. Install the required packages:

```bash
    npm install
```

3. Deploy the App to an specific Rocket.Chat instance:

```bash
    rc-apps deploy --url <your-rocket-url> --username <your-admin-username> --password <your-admin-password>
```
- If deploying to an specific Rocket.Chat instance, make sure to enable `Development Mode` on `Administration > General > Apps > Enable Development Mode`.

Refer to this [guide](https://docs.rocket.chat/apps-development/getting-started) if you need more info.

## Command Reference

### /iniciar-conversa {channel} {urn}

- **Description**:
    - Start the configured flow on the App's settings for the specified contact and agent that called the command.

- **Supported Channels**:
    - Whatsapp: `whatsapp`
    - Telegram: `telegram`

-**Examples**:
    - `/iniciar-conversa whatsapp 558299999999`
    - `/iniciar-conversa telegram 123456789`

## Enpoint Reference

Error responses body returned in this pattern:

```json
{
    "error": "error details message"
}
```

### GET /start-flow

- **Description**:
    - Start the configured flow on the App's settings for the specified contact and agent then redirects to the Rocket.Chat application.
- **Query Parameters**:
    - `contactUrn`: The contact URN that is registered on Push.
- **Success result**:
    - Status: `307 Temporary-Redirect` 
- **Error result**:
    - Status: 
        - `400 Bad-Request` 
            - Missing cookies header
            - Invalid agentId on cookies
            - Invalid URN.
        - `500 Internal-Server-Error`
            - Unexpected Error occurs.
