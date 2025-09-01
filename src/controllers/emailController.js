const { Resend } = require("resend")
const { standardResponse } = require("../utils/response")

const resend = new Resend(process.env.RESEND_API_KEY)

const sendContact = async (req, res) => {
  const { to, subject, html } = req.body

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Faltan datos en la solicitud" })
  }

  try {
    const response = await resend.emails.send({
      from: "contacto@lifelinesaludmental.com",
      to: [to],
      subject,
      html,
    })

    res.status(201).json({ message: "Correo enviado", response })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  sendContact
}