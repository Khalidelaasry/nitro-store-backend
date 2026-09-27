require("dotenv").config();

const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Nitro Store backend is running",
  });
});

// Create CoinRemitter LTC invoice
app.post("/create-invoice", async (req, res) => {
  try {
    const form = new FormData();

    form.append("amount", "9.99");
    form.append("name", "Nitro Boost");
    form.append("fiat_currency", "USD");
    form.append("description", "NitroBoost");

    const response = await axios.post(
      "https://api.coinremitter.com/v1/invoice/create",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "x-api-key": process.env.COINREMITTER_API_KEY,
          "x-api-password": process.env.COINREMITTER_API_PASSWORD,
        },
      }
    );

    console.log("CoinRemitter response:");
    console.log(JSON.stringify(response.data, null, 2));

    const invoice = response.data?.data;

    if (!invoice) {
      return res.status(500).json({
        success: false,
        error: "Invalid response from CoinRemitter",
        coinremitterResponse: response.data,
      });
    }

    res.json({
      success: true,

      invoiceId: invoice.invoice_id,
      invoiceUrl: invoice.url,

      // CoinRemitter amounts
      amountLtc:
        invoice.total_amount?.LTC ??
        invoice.total_amount?.ltc ??
        null,

      amountUsd:
        invoice.total_amount?.USD ??
        invoice.total_amount?.usd ??
        null,

      status: invoice.status ?? null,
    });
  } catch (error) {
    console.error(
      "CoinRemitter error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      error: "Could not create LTC invoice",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});