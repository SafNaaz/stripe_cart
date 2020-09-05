if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/store', (req,res)=>{
    fs.readFile('items.json',(err, data)=>{
        if(err){
            res.status(500).end()
        }else{
            res.render('store.ejs', {
                stripePublicKey,
                items : JSON.parse(data)
            })
        }
    })
})

app.post('/purchase', (req,res)=>{
    fs.readFile('items.json',(err, data)=>{
        if(err){
            res.status(500).end()
        }else{
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let total = 0
            req.body.items.forEach(item => {
                const itemJson = itemsArray.find( i =>{
                    return i.id == item.id
                })
                total = total + itemJson.price * item.quantity
            });

            stripe.charges.create({
                amount : total,
                source : req.body.stripeTokenId,
                currency : 'usd',
                //added below for bypassing indian restrictions
                description: 'Software development services',
                shipping: {
                    name: 'Jenny Rosen',
                    address: {
                      line1: '510 Townsend St',
                      postal_code: '98140',
                      city: 'San Francisco',
                      state: 'CA',
                      country: 'US',
                    },
                  }
            }).then(()=>{
                console.log('Charge Successful')
                res.json({message:"Successfully purchased items"})
            }).catch((err)=>{
                console.log(err)
                console.log('Charge Fail')
                res.status(500).end()
            })
        }
    })
})

app.listen(3000)