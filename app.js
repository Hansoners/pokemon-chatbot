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
const pokemon_species_endpoint = ['description', 'evolutions'];

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
                        "is_image": true,
                        url: `https://www.serebii.net/pokemon/art/${id}.png`
                    }
                });
            }
        }

        if (index2 !== -1 || intent.displayName == 'evolutions') {
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

            if (intent.displayName == 'evolutions') {
                const evolution_resp = await axios_instance.get(`/evolution-chain/${evolution_chain_id}`);
                const evolution_req = parameters.evolutions;
               
                let pokemon_evol = [evolution_resp.data.chain.species.name];
                fulfillmentText = `${pokemon} does not have an evolution`;
        
                if (evolution_resp.data.chain.evolves_to.length) {
                  pokemon_evol.push(evolution_resp.data.chain.evolves_to[0].species.name);
                }
        
                if (evolution_resp.data.chain.evolves_to[0].evolves_to.length) {
                  pokemon_evol.push(evolution_resp.data.chain.evolves_to[0].evolves_to[0].species.name);
                }
        
                let evolution_chain = pokemon_evol.join(' -> ');
        
                const order = pokemon_evol.indexOf(pokemon);
                const next = pokemon_evol[order + 1];
                const prev = pokemon_evol[order - 1];
                
                const evolution_text = {
                  'evolution_chain': `${pokemon}'s evolution chain is: ${evolution_chain}`,
                  'first_evolution': `${pokemon_evol[0]} is the first evolution`,
                  'last_evolution': `${pokemon_evol[pokemon_evol.length - 1]} is the last evolution`,
                  'next': `${pokemon} evolves to ${next}`,
                  'prev': `${pokemon} evolves from ${prev}`
                };
        
                if (evolution_text[evolution_req]) {
                  fulfillmentText = evolution_text[evolution_req];
                }
        
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

