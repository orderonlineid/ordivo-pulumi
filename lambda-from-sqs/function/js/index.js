import axios from 'axios'

export const handler = async (event) => {
  const url = process.env.URL || ''
  const token = process.env.TOKEN || ''

  console.log('[INFO] Url: ' + url)

  try {
    for (const record of event.Records) {
      const headers = {
        'User-Agent': 'axios/1.6.6',
        Authorization: 'Basic ' + token,
      }

      const payload = record.body
      console.log('[INFO] Body: ' + payload)

      const response = await axios.post(url, payload, {
        headers: headers,
      })

      console.log('[INFO] Response: ' + JSON.stringify(response.data))

      return {
        headers: { 'Content-Type': 'application/json' },
        body: response.data,
        statusCode: 200,
      }
    }
  } catch (error) {
    console.error('[ERRO] Error forwarding request:', error)
    return {
      headers: { 'Content-Type': 'application/json' },
      body: error,
      statusCode: 400,
    }
  }
}
