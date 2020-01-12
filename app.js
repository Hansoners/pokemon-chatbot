const express = require('express')
const http = require('http')
require("dotenv").config();
const app = express()
const port = process.env.PORT || 3000
const bodyParser = require("body-parser");
const axios = require("axios");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const axios_instance = axios.create({
    baseURL: 'https://pokeapi.co/api/v2',
    timeout: 3000,
});

app.get('/', (req, res) => {
    res.status(200).send('Server is working.')
})

app.listen(port, () => {
    console.log(`🌏 Server is running at http://localhost:${port}`)
})

const pokemon_endpoint = ['abilities', 'moves', 'photo'];
const pokemon_species_endpoint = ['description', 'evolution'];

app.post('/pokedex', async (req, res) => {

    try {
        const { intent, parameters, outputContexts, queryText } = req.body.queryResult;

        const pokemon = (parameters.pokemon) ? parameters.pokemon.toLowerCase().replace('.', '-').replace(' ', '').replace("'", "") : '';
        const specs = parameters.specs;

        let response_obj = {};

        const index = pokemon_endpoint.indexOf(specs);
        console.log(index);
        const index2 = pokemon_species_endpoint.indexOf(specs);

        if (index !== -1) {
            const { data } = await axios_instance.get(`/pokemon/${pokemon}`);

            let fulfillmentText;
            const id = String(data.id).padStart(3, '0');
            const value = (specs == 'abilities') ? data.abilities.map(item => item.ability.name).join(', ')
                : data.moves.map(item => item.move.name).join(', ');

            fulfillmentText = `${pokemon} has the following ${specs}: ${value}`;

            Object.assign(response_obj, { fulfillmentText });

            if (specs == 'photo') {
                Object.assign(response_obj, {
                    fulfillmentText: pokemon,
                    payload: {
                        "is_image":true,
                        url: `https://www.serebii.net/pokemon/art/${id}.png`
                    }
                });
            }
        }

        if (index2 !== -1 || intent.displayName == 'evolution') {
            const { data } = await axios_instance.get(`/pokemon-species/${pokemon}`);
            const evolution_chain_id = data.evolution_chain.url.split('/')[6];
            const text = data.flavor_text_entries.find(item => {
                return item.language.name == 'en';
            });

            let fulfillmentText;
            if (specs == 'description') {
                fulfillmentText = `${pokemon}:\n\n ${text.flavor_text}`;
                Object.assign(response_obj, {
                    fulfillmentText
                });
            }
        }
        
        return res.json(response_obj);

    }

    catch (err) {
        console.log('err: ', err);
        return res.json({
            fulfillmentText: "Sorry: API error."
        });
    }
});

