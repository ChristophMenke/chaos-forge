# Backfill Diff Report

Generated: 2026-04-11T10:46:14.763Z

## Summary

- **269 UPDATEs** — existing seed monsters enriched with narrative sections
- **73 INSERTs** — new monsters added to the DB
- **10 SKIPPED inserts** — defensive duplicate check (token overlap ≥50% with an existing row)
- **1 BLOCKED keys** — hard-skipped compendium entries (deleted in a prior cleanup migration)
- **0 Custom monsters touched** (hard filter: `is_custom = false`)

## UPDATEs

| Monster (EN) | Matched existing row | Matched by |
|---|---|---|
| Aarakocra | Aarakocra (`fef166a6-0bff-4830-99e5-b43edb6606c7`) | name_en |
| Aboleth | Aboleth (`505bceb1-21a8-46f1-a062-2d04c1d7d848`) | name_en |
| Ankheg | Ankheg (`9cbaef5e-b8c7-4bec-a09b-2b487589b40d`) | name_en |
| Ant | Ameise (`85628220-33ca-4a69-9c52-3616520035c5`) | name_en |
| Ant Lion, Giant | Ameisenlöwe, Riesenameisenlöwe (`ee1a9aff-350e-4edc-9164-ce8f76d2ce28`) | name_en |
| Ape, Carnivorous | Fleischfressender Affe (`52f38e71-4152-471a-b6f6-1eaf26b61687`) | name_en |
| Arcane | Arkane (`ccdd5d45-e0c5-4b43-8159-c2a496a2ba0f`) | name_en |
| Aurumvorax | Aurumvorax (`6003b255-d15a-467b-bee1-80e3d2ab940a`) | name_en |
| Baatezu, Lesser, Abishai | Baatezu, Niedere, Abishai (`f006beed-78ff-4ac7-a3c8-358bfa73fa72`) | name_en |
| Baatezu, General Information | Baatezu (`cc00c71c-e092-4d40-99bb-33a0a0a98282`) | name_en |
| Baatezu, Greater, Pit Fiend | Grubenteufel (`485d4c87-7cc8-4769-91ee-2eb752b2c916`) | override |
| Baboon | Pavian (`4e0786db-f5c7-4ea7-85c9-3ee725fda8d7`) | name_en |
| Badger | Dachs (`3b7016ad-3c17-43c7-b273-97305c77218a`) | name_en |
| Banshee | Banshee (`3fe4449b-f076-46ed-b5af-102709c4644d`) | name_en |
| Barracuda | Barrakuda (`81719f11-3cc7-4d58-8179-0a341876c1aa`) | name_en |
| Basilisk | Basilisk (`7b933cd7-6d39-4d90-a0ea-fcfa0dd6005c`) | name_en |
| Beetle, Giant | Riesenkäfer (`d196bd28-e1ae-4fb9-a14f-5358b38b8307`) | name_en |
| Behir | Behir (`36447632-95fe-492b-9a44-955a1d7223b2`) | name_en |
| Beholder and Beholder-kin I | Betrachter (`4f7de8af-6abb-4a4f-b1e6-b118d65f54e3`) | override |
| Bird | Vogel (`32d4f9f9-b78c-4300-a688-602f9884264e`) | name_en |
| Boar | Wildschwein (`101036eb-4cf6-4612-b9e9-ad83c02a3b8b`) | override |
| Bookworm | Bücherwurm (`bdd2a6a6-3200-4b37-a54f-455b21fd7804`) | name_en |
| Brain Mole | Gehirnmaulwurf (`d717a9dc-86b5-4351-952c-d4f0cb5747d0`) | name_en |
| Broken One | Gebrochene (`b6313384-ce4b-4625-884b-6342e8348233`) | name_en |
| Brownie | Brownie (`de323c3c-95c0-4fc0-b638-17ad2a1a10ad`) | name_en |
| Bugbear | Bugbear (`25e1722c-44ed-4c53-a80a-38f0582dc732`) | name_en |
| Bulette | Bulette (`8c380a49-ba6a-4800-a9be-a301491c0515`) | name_en |
| Bullywug | Bullywug (`184f3e85-17dc-402d-84d6-b685c3bdf79b`) | name_en |
| Carrion Crawler | Aasräuber (`ce6b1b2b-7a45-4790-8c34-31b625c52cc8`) | name_en |
| Cat, Small | Katze, Klein (`cdbbaa45-872f-4242-b468-4bb06f0d2b86`) | name_en |
| Cave Fisher | Höhlenfischer (`9163f72b-79f5-4b4c-9382-2d608f84b57d`) | name_en |
| Centaur | Zentaur (`a2d55d8a-362e-418d-8be3-005eb171afa2`) | name_en |
| Centipede | Tausendfüßer (`b648f2bb-8451-469f-bcfa-eb465162f92b`) | name_en |
| Chimera | Chimäre (`2fa8824e-cc97-47ae-879f-7c571b9ee144`) | name_en |
| Cloaker | Cloaker (`0a370bd8-1736-4d13-a8c0-a1a1835d5f78`) | name_en |
| Cockatrice | Cockatrice (`6c685aaa-012b-407e-87ef-71a4c080a28f`) | name_en |
| Couatl | Couatl (`9279a170-81c7-4985-918d-146a51571f94`) | name_en |
| Crabman | Krabbenmann (`4c6fa081-5dfb-4b36-8e2a-95d06b62efba`) | name_en |
| Crawling Claw | Kriechende Klaue (`2afc8b7d-7c8e-45f7-9044-72f37e129f20`) | name_en |
| Crocodile | Krokodil (`8dd720a8-56e8-48f1-abf3-524abf428686`) | name_en |
| Crustacean, Giant | Krebstier, Riesig (`f3706ebb-3389-4139-aee8-f7305438d022`) | name_en |
| Crypt Thing | Kryptenwächter (`284a8820-f9cf-4b2a-bef7-336c33c53c5d`) | name_en |
| Death Knight | Todesritter (`9aa11f9a-3004-4328-b6ef-1355ebec85a6`) | name_en |
| Dinosaur I | Dinosaurier I (`4307cdce-f7f4-4374-90e2-88fff22cee3d`) | name_en |
| Displacer Beast | Verlagerungsbestie (`98744640-137b-4aff-97a6-bdd37c276be3`) | name_en |
| Dog | Hund (`904b79ba-c126-49c7-bba6-5e57d6ef9ac0`) | name_en |
| Dolphin | Delfin (`85ef3210-4db4-476f-b4cf-d920b765daec`) | name_en |
| Doppelganger | Doppelgänger (`6542721a-fd42-4579-9ed6-fa42584ba3f8`) | name_en |
| Dracolich | Dracolich (`41630ff4-7acc-4309-a46e-0a8b18e8ed11`) | name_en |
| Dragon, Brown | Brauner Drache (`ea9d0799-e7bd-404d-aa7c-aa190144796f`) | name_en |
| Dragon, Chromatic, Black | Schwarzer Drache (Erwachsen) (`e71ad1b4-9c1a-4435-be38-a3571152d95a`) | override |
| Dragon, Chromatic, Blue | Blauer Drache (Erwachsen) (`016bfcc1-3757-44d2-9e73-144007973401`) | override |
| Dragon, Chromatic, Green | Grüner Drache (Erwachsen) (`737b66d6-8137-42f4-bc8d-3cded31e17e3`) | override |
| Dragon, Chromatic, Red | Roter Drache (Erwachsen) (`a1fbec0d-d22c-44b5-a80e-1cd1991a4ef8`) | override |
| Dragon, Chromatic, White | Weißer Drache (Erwachsen) (`ec697d78-9c4b-4857-a350-4507a9b33fd7`) | override |
| Dragon, Deep | Tiefendrache (`1ed8b61a-70e9-4075-8969-2be5ec32f2fd`) | name_en |
| Dragon, Gem, Amethyst | Amethystdrache (`c904f43f-48ef-4b5d-8109-3997466b3d79`) | name_en |
| Dragon, Gem, Crystal | Kristalldrache (`7d45eee7-f32e-4b88-8dc9-188e05362261`) | name_en |
| Dragon, Gem, Emerald | Smaragddrache (`5dcdf672-9789-41c0-9eb6-921c69d412d3`) | name_en |
| Dragon, Gem, Sapphire | Saphirdrache (`0bcee064-db60-4dc7-919d-cef062cb99a0`) | name_en |
| Dragon, Gem, Topaz | Topazdrache (`244e6dd8-29f9-4f68-8542-2209215acdbc`) | name_en |
| Dragon, Metallic, Brass | Messingdrache (Erwachsen) (`071fedc3-323c-46a0-b96e-c347fb42c451`) | override |
| Dragon, Metallic, Bronze | Bronzedrache (Erwachsen) (`e6e6cf4f-d456-4ba1-8f2b-b81c704620a0`) | override |
| Dragon, Metallic, Copper | Kupferdrache (Erwachsen) (`de365c54-39e5-4a5d-85c8-e7b71ea96bdb`) | override |
| Dragon, Mercury | Quecksilberdrache (`eea1341b-d665-4a91-b5ce-5a6ed702e469`) | name_en |
| Dragon, Metallic, Gold | Golddrache (Erwachsen) (`c8d0744e-5ff6-4ba5-a423-3ccc0cb67672`) | override |
| Dragon, Mist | Nebeldrache (`004afbcb-f0ce-4a1e-916f-8c74c20ada58`) | name_en |
| Dragon, Metallic, Silver | Silberdrache (Erwachsen) (`17fe4c9b-cc38-43f8-ae49-3b920c777843`) | override |
| Dragon, General Information | Drache, Allgemeine Informationen (`8df7adde-909f-4950-94b2-1a2a53f2f668`) | name_en |
| Dragon, Shadow | Schattendrache (`3447c7e6-2699-4acb-a204-e1cd69c6d142`) | token_sort |
| Dragon, Steel | Stahldrache (`95f0222c-2f3d-4872-9902-b1757403adf9`) | name_en |
| Dragon, Yellow | Gelber Drache (`db8afd84-0925-4841-a77b-3b5a8f4133ee`) | name_en |
| Dragonfish | Drachenfisch (`24302787-a7d0-49b6-b23b-5841ec0822b9`) | name_en |
| Dragonne | Dragonne (`e07a6d30-f72e-4abd-8af0-a0186e00dad1`) | name_en |
| Dragon Turtle | Drachenschildkröte (`420f276d-4f13-4298-8215-97426f08e953`) | name_en |
| Dragonet, Faerie Dragon | Feendrache (`f7952f05-fa23-4b93-9d70-aeb7f6526a1a`) | name_en |
| Dragonet, Fire Drake | Feuerdrache (`78b41afd-e7d8-4b81-8b4c-d8482eb5fa1c`) | name_en |
| Dragonet, Pseudodragon | Pseudodrache (`d8f51b58-aa6a-4b81-8845-5c768e97888a`) | name_en |
| Dryad | Dryade (`92334491-6039-4655-a7e6-2b63cf58dccf`) | name_en |
| Dwarf, Derro | Derro (`57753c72-30f1-480c-9b4a-a9f12dbe368c`) | override |
| Dwarf, Duergar | Duergar (`3109c1b1-8242-4a1a-b533-e9bf12507de4`) | override |
| Dwarf | Zwerg (`9aca76cc-31b5-411f-8262-4e52152968ad`) | name_en |
| Dwarf, Gully | Rinnensalzwerg (`30a151b2-cc9e-4abe-b822-531559b1c28e`) | name_en |
| Eagle | Adler (`1b8dcf1d-92af-4abc-aaec-21699fb284ba`) | name_en |
| Eel | Aal (`9f917914-1b5c-4938-8a05-0780807e1d59`) | name_en |
| Elemental (Athas), General Information | Elementar (Athas), Allgemeine Informationen (`cdc9840a-ddf1-45b8-b5fb-c87b8f0aa67c`) | name_en |
| Elemental, Air Kin | Luftelemental (12 TW) (`7d185771-221e-4269-8543-497e8737c3d2`) | override |
| Elemental, Earth Kin | Erdelemental (12 TW) (`79d7f51a-5278-4a6b-8596-4dca881c76ba`) | override |
| Elemental, Fire Kin | Feuerelemental (12 TW) (`288432a5-3ef5-45bc-8819-40d253c17be7`) | override |
| Elemental, Composite | Elementar, Verbundelement (`5b7aa427-248b-4d9b-b5ee-814a03a36d21`) | name_en |
| Elemental, General Information | Elementar, Allgemeine Informationen (`66cc8a3b-f4fd-48ae-9652-56676bb18fe5`) | name_en |
| Elf | Elf (`0be7b709-3f81-4605-93c6-3100ade1c914`) | name_en |
| Elf, Aquatic | Elf, Wasseself (`8f038a0e-b0d6-4214-bf31-5f2a25faa423`) | name_en |
| Elf, Drow | Drow (`43284770-cfb7-47dc-b83e-9762c1325745`) | override |
| Ettercap | Ettercap (`51be6943-7459-44db-867e-b0b9675a5403`) | name_en |
| Eyewing | Augenflügel (`70c4cf01-cd0c-4076-8a18-a216af9ac4bd`) | name_en |
| Feyr | Feyr (`dda2f7a3-77c0-45e7-856b-9165893178eb`) | name_en |
| Fish | Fisch (`d829514d-0a84-4903-9ad2-0ecd4aef6285`) | name_en |
| Fish, Giant | Fisch, Riesen- (`872e0310-4630-4724-97f8-f1950b05e145`) | name_en |
| Fungus | Pilz (`c49bcf19-54ca-4816-a3d1-7e5a39a6ae46`) | name_en |
| Galeb Duhr | Galeb Duhr (`c57eda81-68da-4c6d-923e-086a0c7beffa`) | name_en |
| Gargantua | Gargantua (`b8373a3a-dca7-40f2-8bf5-84a8551a840d`) | name_en |
| Gargoyle I | Gargoyle (`bdf7ca38-69a5-4b80-979a-4b61b839fb18`) | override |
| Genie | Dschinn (`664cfdb5-1580-4994-94d9-9eca53301f60`) | override |
| Ghost | Geist (`a4ccb67d-9f4f-4ab4-9ef6-26fdb76bcf20`) | name_en |
| Ghoul | Ghul (`78386fa7-ba98-408c-90f5-f07fabbf6e56`) | name_en |
| Giant, Cloud | Wolkenriese (`ee6abec1-6722-4373-9748-65992fc5de87`) | token_sort |
| Giant, Cyclops | Riese, Zyklop (`5891f0b5-618e-4f6d-9fb6-df63b80d96cd`) | name_en |
| Giant, Ettin | Ettin (`a1a67f73-128f-495a-ab63-bd08c77a7e5f`) | override |
| Giant, Firbolg | Riese, Firbolg (`dfc4ee67-3f41-49b3-bd24-c2b5b3293fa1`) | name_en |
| Giant, Fire | Feuerriese (`a41b6f32-3409-4a2d-97e8-5c1e4a715f6c`) | token_sort |
| Giant, Fog | Nebelriese (`9e945f11-45e1-4496-b610-a5ec09dc4434`) | name_en |
| Giant, Fomorian | Riese, Fomorianischer (`f49d24dc-2ed9-4af4-aa5d-e30252ac58b1`) | name_en |
| Giant, Frost | Frostriese (`a822e9d0-3341-437d-b493-bdc155be2a0a`) | token_sort |
| Giant, Hill | Hügelriese (`17692fd9-dd69-4f43-b41b-aaa638cd195e`) | token_sort |
| Giant, Mountain | Riese, Berg- (`aa067245-6c28-4b81-93c7-6b0e655dbef1`) | name_en |
| Giant, Stone | Steinriese (`1a4628fd-cde4-4067-904a-89584c34647d`) | token_sort |
| Giant, Storm | Sturmriese (`f97dd1c6-b4d2-498b-8a7e-2d7ffb424e11`) | token_sort |
| Giant, Verbeeg | Riese, Verbeeg (`386bf9f3-1d18-4d00-b37b-8ccbedbba5d1`) | name_en |
| Giant, Wood | Waldriese (`dfe9fa7a-1380-4c0a-9fe5-96c9bca305f3`) | name_en |
| Gibberling | Gibberling (`e6adf19c-eed7-4bf9-b221-92b1657d24b5`) | name_en |
| Gith | Gith (`51870ccb-89bd-414e-8ad5-2b829cf2e872`) | name_en |
| Gith, Pirate of | Gith-Pirat (`ba97ad80-f3c1-4783-a7b5-46551208c7e9`) | name_en |
| Githyanki | Githyanki (`5802a342-dcf4-43d4-aae3-fd2ada78867a`) | name_en |
| Githzerai | Githzerai (`efaefbf8-50ba-45f3-8658-dd7cfba2ec40`) | name_en |
| Gloomwing | Düsterflügel (`3908b906-ddfa-4a95-b8c6-e06e0be7d47c`) | name_en |
| Gnoll | Gnoll (`527af4eb-4f96-4231-88ac-8fac550ab748`) | name_en |
| Gnome | Gnom (`95ce237f-ce73-47f3-a7a1-b2707c1ffbb3`) | name_en |
| Gnome, Spriggan | Gnom, Spriggan (`28fcf700-2373-4ee5-b0a8-7ea3286e37e0`) | name_en |
| Goblin | Goblin (`3331794c-ecfc-4d56-9e23-1f211a9120c3`) | name_en |
| Golem, General Information | Golem, Allgemeine Informationen (`75d5b7b9-5814-4c37-b64c-d8942b88877d`) | name_en |
| Golem I (Greater Golem) | Golem I (Größerer Golem) (`223ed488-80f7-4abc-9796-1ce28d369f32`) | name_en |
| Golem II (Lesser Golem) | Golem II (Niederer Golem) (`dc4584ce-d41b-466d-8d20-9cfb90d8af88`) | name_en |
| Golem III | Golem III (`0da7d70f-5e93-4e0e-8e85-df01120b159a`) | name_en |
| Golem V | Necrophidius und Vogelscheuche (`5bab3209-9271-4d95-a8c0-db18699c57d0`) | name_en |
| Gorgon | Gorgon (`2e255988-c85e-4ede-b97b-23e41d78f3fe`) | name_en |
| Gremlin, Jermlaine | Gremlin, Jermlaine (`0a9191ff-a23c-4df9-a26f-81ae33a1d7d1`) | name_en |
| Gremlin | Gremlin (`e6bc3b3f-a714-42cf-9c79-ccb843055818`) | name_en |
| Griffon | Greif (`98979f50-f737-4a52-8b7c-eb86dd4603e3`) | name_en |
| Grimlock | Grimlock (`1acc33a7-e5f9-4474-a55c-d679d3f2c5e8`) | name_en |
| Grippli | Grippli (`2b59e04c-fc17-4ad7-abb0-954d91c3616e`) | name_en |
| Guardian Daemon | Wächterdämon (`97310ab2-9c76-4fa8-a60b-86beca0d92df`) | name_en |
| Hag | Hexe (`853ab9d5-6888-4c95-aae3-b5d17e68e100`) | name_en |
| Halfling | Halbling (`6b11453a-a838-4916-a71c-99deaed270a8`) | name_en |
| Harpy | Harpyie (`76d914ca-b4b2-49f8-b2f0-b48aa9ee08e9`) | name_en |
| Hatori | Hatori (`8e0c139a-d8fa-4403-934d-c74d236e0b9e`) | name_en |
| Haunt | Haunt (`46e6cc10-b345-4b1d-9b02-1e245f79172b`) | name_en |
| Hawk | Habicht (`e914aa5a-d127-4ad0-b403-5aa9b8de2fc2`) | name_en |
| Hell Hound | Höllenhund (`61a6774c-176d-46fa-abf1-5d02391b27cf`) | name_en |
| Hippogriff | Hippogryph (`d8173f2f-7342-4382-9229-e89c6231e78a`) | name_en |
| Hobgoblin | Hobgoblin (`f29578b2-fc23-4336-8582-8b55afe0fe0a`) | name_en |
| Homunculus | Homunculus (`72939647-f425-4685-b2fc-a40507cfea74`) | name_en |
| Hook Horror | Hakengrausamkeit (`07f3428c-6230-4949-bbab-202102c4e26d`) | name_en |
| Hornet, Giant | Riesenhornisse (`3c4c8347-ec9d-44b8-bdc6-4a884f0e86cb`) | name_en |
| Human | Mensch (`efe6a1ed-df7f-4671-a647-f69604e4b6f8`) | name_en |
| Hydra | Hydra (`443985dd-a475-4883-ab46-eeb64cd4d0ef`) | name_en |
| Hyena | Hyäne (`b87766b4-aef2-4007-8958-2279565d10d0`) | name_en |
| Imp | Imp (`c10da93a-c336-4e25-b3a9-03f84d2c9bb8`) | name_en |
| Insect, Giant | Insekt, Riesig (`5a53d6fb-33d4-4dde-9c69-9478374e9a4f`) | name_en |
| Insect Swarm | Insektenschwarm (`8ed09db5-33ee-40c4-83a4-f5ab5d80793d`) | name_en |
| Intellect Devourer | Intellektverschlinger (`3d99e134-3e9a-4b92-8169-3e43f3c3e8db`) | name_en |
| Invisible Stalker | Unsichtbarer Pirscher (`a46a7077-56d6-44d5-9ed7-5015cb864eb7`) | name_en |
| Ixitxachitl | Ixitxachitl (`071a2ca0-612a-43a4-9562-020d61b35f1e`) | name_en |
| Jackal | Schakal (`f01bb5fd-1b88-4a4e-bb44-6ca0d8975b78`) | name_en |
| Kelpie | Kelpie (`6e47f344-ad5e-4e20-956c-3a5f5d299059`) | name_en |
| Kenku | Kenku (`3cf86867-c308-4769-9ced-993f1fb4e5d9`) | name_en |
| Killmoulis | Killmoulis (`127bfa87-62e6-4544-ac4a-7608af82d4e3`) | name_en |
| Ki-rin | Ki-rin (`23dcb49f-e7c6-43e0-a0ac-0b0e54210cf7`) | name_en |
| Kobold | Kobold (`7445eca8-e871-4986-93b4-e33bbab980d9`) | name_en |
| Korred | Korred (`e1ca3530-c619-4dfb-90f8-aa51ae8a98e4`) | name_en |
| Kuo-Toa | Kuo-Toa (`cf1aebfd-e503-407f-8ba3-2154fc04c521`) | name_en |
| Lamprey | Neunauge (`657d9001-e77e-4c03-860a-d2c439f58e99`) | name_en |
| Lich | Lich (`dbf8cc6c-e44f-4274-8036-ebb45f0bbfb0`) | name_en |
| Living Wall | Lebende Wand (`ad5dbd43-f8e5-4319-b3ff-907c6aa28536`) | name_en |
| Lizard | Echse (`7534ad53-1864-44fc-ab70-ad1025a0ce19`) | name_en |
| Lizard Man | Lizardman (`9abd6089-51f3-4cc7-aebd-2027a1928d14`) | name_en |
| Lurker | Lauerer (`f3850df3-16fe-4eb6-9c1b-f001cdc180d7`) | name_en |
| Lycanthrope, Wererat | Werrate (`97bd3238-3bb4-4cec-92bb-fc39e6552d19`) | override |
| Mammal | Säugetier (`ef1ef330-5238-4d06-826f-c5ae56fc8fb5`) | name_en |
| Mammal, Herd I | Säugetier, Herdentier I (`1bf776a5-bf94-4496-9b54-1a7071c0fe7b`) | name_en |
| Mammal, Minimal | Säugetier, Minimal (`d81a2905-b469-40a3-8b54-0a20484149a4`) | name_en |
| Manticore | Mantikor (`df608b4d-2538-4122-b02d-a137c1c1ded0`) | name_en |
| Medusa, Maedar | Maedar (`2c900f84-b14e-4c8b-b628-399129f16581`) | name_en |
| Medusa | Medusa (`915a0183-2b17-48d0-ae5f-f8608aa57c30`) | name_en |
| Merman | Meermann (`e4165830-24a6-4ca3-80ba-12e83b14e569`) | name_en |
| Mimic | Mimic (`d607af96-a6fe-4bca-a8a1-5c1d5d402e09`) | name_en |
| Mind Flayer | Illithid (`5e78ea65-6cf1-4b05-a8f3-a1915215fe8c`) | name_en |
| Minotaur | Minotaurus (`5f3bfd3b-12e5-4bc5-add0-56587f706d78`) | name_en |
| Mist, Crimson Death | Nebel, Karmesinroter Tod (`b0bae14d-a12f-46cd-af1b-a717aee34ffe`) | name_en |
| Mist, Vampiric | Nebel, Vampirischer (`cd27ae6d-223e-49b8-a044-5c4781994dcd`) | name_en |
| Mold I | Schimmel I (`8720e5c9-dfce-4b3b-aecd-dc834ae1daba`) | name_en |
| Moldman | Schimmelmann (`8dd92dea-5bf3-4c57-99d0-171bcdde1949`) | name_en |
| Mongrelman | Mongrelman (`310a4ca0-de1b-44db-961c-bbdb5f678bf4`) | name_en |
| Mummy | Mumie (`ec9c9ae1-74f8-45a6-a12b-1958059dabe0`) | name_en |
| Naga, Dark | Dunkle Naga (`79c3e85b-c6f7-434a-a0f0-a138ff2263ea`) | name_en |
| Neogi | Neogi (`1b0e4129-c7db-4ed0-96c6-5b7ad4bf2120`) | name_en |
| Nightmare | Nachtmahr (`c3153758-ed0c-40c6-b8ce-9be7d6f0a6a4`) | name_en |
| Nixie | Nixe (`61bdf113-1e71-4ac6-99a1-1a637746fb23`) | name_en |
| Obliviax | Obliviax (`36adf1b8-8897-410c-9237-6a6678f6b4ce`) | name_en |
| Ogre | Ogre (`0182e5f5-2ac2-4e76-af23-3ce23ecb7167`) | name_en |
| Ogre, Half- | Halbogre (`3446c322-236f-4b43-bc0e-36bd8cc92072`) | name_en |
| Ooze/Slime/Jelly I | Schleim/Glibber/Gallert I (`c60f9fb8-7e16-4420-9e79-daeab2297f22`) | name_en |
| Ooze/Slime/Jelly, Slithering Tracker | Gleitender Verfolger (`222207ee-419f-4fd7-b20a-c91e0af24cb6`) | name_en |
| Orc | Orc (`20e1e3a2-52c3-4815-bbf3-131513a1e063`) | name_en |
| Otyugh | Otyugh (`50c08313-c43f-4768-b787-9a6c4ffc7c57`) | name_en |
| Owl | Eule (`e4d42824-ea4c-486c-a641-06a10370167d`) | name_en |
| Owlbear I | Eulenbär (`d5362fc5-8ae7-4672-a570-35d59d1d49f5`) | name_en |
| Pegasus | Pegasus (`caf01f44-8452-45b0-9ec8-0a4e1f0ffc31`) | name_en |
| Peryton | Peryton (`33b48c1d-3cb2-4fa1-a18b-9f87aed3c4a7`) | name_en |
| Phantom | Phantom (`97ca7303-1022-4666-8864-07761bf15c63`) | name_en |
| Piercer | Piercer (`3d6cb45e-a471-4265-975d-ec5e7c3c0808`) | name_en |
| Piranha | Piranha (`20997bc2-6426-477c-b8bc-c823df0b2115`) | name_en |
| Pixie | Pixie (`10805627-1e77-4329-9eb7-18ace29f696c`) | name_en |
| Poltergeist | Poltergeist (`ddbd68cf-54e4-4da6-bf06-12c2d44a5d1f`) | name_en |
| Porcupine | Stachelschwein (`91aa50d8-e8eb-4c78-b515-73e85057afc1`) | name_en |
| Quaggoth | Quaggoth (`d4855af1-2a9e-487a-b706-5d567d596b47`) | name_en |
| Rakshasa | Rakshasa (`49f4f643-48da-4287-9b53-fe9d7e8d7a15`) | name_en |
| Ray | Rochen (`e6794ddb-bb26-40e4-ba55-eac0bfbd7011`) | name_en |
| Revenant | Revenant (`013447d5-3ec4-4cb0-9b29-62831c6ed203`) | name_en |
| Roc | Roc (`bff35554-eb5b-4836-996b-e6c609f790fa`) | name_en |
| Roper | Roper (`659cc4e0-203f-481b-9c85-0d5ffdf311ab`) | name_en |
| Rot Grub | Fäulniswurm (`36d4666c-06c9-4d02-8e77-29e1c2fbdb79`) | name_en |
| Rust Monster | Rostmonster (`aae31dbb-2905-4bf4-bd7d-b99381458264`) | name_en |
| Sahuagin | Sahuagin (`e1998d5d-40f4-4fc9-88f7-02a251f5ee9f`) | name_en |
| Satyr | Satyr (`d9f7bc04-9065-4481-a7e7-c29afe2243e6`) | name_en |
| Scorpion | Skorpion (`c2bce4f0-c553-4420-9358-5c2d724dee0d`) | name_en |
| Sea Horse, Giant | Riesenseepferdchen (`ae05aae5-11bd-4c87-ae96-3540c4928e35`) | name_en |
| Shadow | Schatten (`f57edf57-0c0c-4a16-accf-fc1e70a08fb7`) | name_en |
| Shambling Mound | Wandelnder Hügel (`e9036941-45b8-4944-baff-a2b51627cb04`) | name_en |
| Shark | Hai (`1bfc2446-0de9-4f08-91a6-8d9515fa9361`) | name_en |
| Shedu | Shedu (`23b428fe-d7b2-47fe-835c-cf8730808a8c`) | name_en |
| Sirine | Sirine (`82e23566-b4fa-45e6-9dc1-ec5235e39e0e`) | name_en |
| Skeleton | Skelett (`50f2e1ae-27d8-4f61-866a-15dac799536f`) | name_en |
| Skeleton, Warrior | Skelettritter (`88ea38ea-669a-494d-9683-c040edc7cc2a`) | name_en |
| Skunk | Stinktier (`4681e2e6-0678-4c64-80bd-35cbe20d5c9c`) | name_en |
| Slaad | Slaad (`1f58357b-6f50-4e81-927f-bb5313b9cc1e`) | name_en |
| Slug, Giant | Riesenschnecke (`0d00215c-706f-4507-bcd3-ba88ff7ff2df`) | name_en |
| Snake, Winged | Geflügelte Schlange (`6b705f5a-e11e-42af-9cd9-5ccde3b1ad9c`) | name_en |
| Spectre | Gespenst (`16969cc4-b8d6-4409-be18-e68ebbd2fab4`) | name_en |
| Spider | Spinne (`684332a6-a387-4a09-b6ae-d0fcc638d6a9`) | name_en |
| Sprite | Sprite (Feenwesen) (`fc8b7620-e1f6-473a-81de-948e694844fb`) | name_en |
| Stirge | Stirge (`b20033a0-52a5-4cd2-8934-98a638648176`) | name_en |
| Su-Monster | Su-Monster (`69663411-d345-4695-9085-2bc3b52cbe01`) | name_en |
| Tako | Tako (`78562a18-29b3-49d2-8a52-6195965e6197`) | name_en |
| Tanar'ri, True, Balor | Balor (`23ed9564-b7ff-461e-bb28-bbc5955c3bc0`) | override |
| Tanar'ri, True, Marilith | Marilith (`8c580c75-b04c-4006-b323-92ab09c8479e`) | override |
| Thought Eater | Gedankenfresser (`5306a302-6296-44eb-8513-38230d49d99f`) | name_en |
| Thri-kreen | Thri-kreen (`a4a44e6f-b8ae-4d82-9dd2-62a1da4e63ec`) | name_en |
| Treant | Treant (`bdb902ce-c5b7-4211-b5ae-729a9692224f`) | name_en |
| Troglodyte | Troglodyte (`270b4417-aacd-43a8-bfd4-5b9b42bf1f45`) | name_en |
| Troll | Troll (`1b08f873-2cee-422d-8f1c-17099381f8a9`) | name_en |
| Umber Hulk | Umber Hulk (`a8c3c8f9-48d8-438a-85da-387e1a8ffc94`) | name_en |
| Unicorn | Einhorn (`760e55a6-1f37-447b-a84b-d16e08169ba5`) | name_en |
| Urd | Urd (`fb338773-ec81-4dbb-bf7f-a1d0ab8c1695`) | name_en |
| Vampire | Vampir (`1f5f82ef-c0c2-430f-881e-467200e28331`) | name_en |
| Weasel | Wiesel (`64dabe1f-c354-4fb9-8dc7-e877601ba3af`) | name_en |
| Wemic | Wemic (`a8514d4e-2938-44c4-9911-3df9cd849556`) | name_en |
| Whale | Wal (`1682bf0c-cdda-4f3c-9246-a41393c41bef`) | name_en |
| Wight | Wight (`64d954e4-3f82-475b-b92f-f5bfb63a9dbb`) | name_en |
| Will O'Wisp | Irrlicht (`42743a2d-925c-45a2-8d74-335d9552b508`) | name_en |
| Wolverine | Vielfraß (`1043f9e8-a10b-48bb-bc8b-1346ad5fb4f0`) | name_en |
| Worm | Wurm (`41d90f49-43cb-4e81-9cd4-0f925d1d9d3a`) | name_en |
| Wraith | Geisterscheinung (`ad8046ab-620b-4f3e-902c-9662d583c46e`) | name_en |
| Wyvern | Wyvern (`33d7a62a-4208-4fe8-9f21-cf0d1c30c699`) | name_en |
| Xorn | Xorn (`06417257-3e71-4507-b673-33aa7e149834`) | name_en |
| Yellow Musk Creeper | Gelbe Moschusschlingpflanze (`21b011d8-100c-4efb-a4de-a06d60af490a`) | name_en |
| Yuan-ti, Histachii | Yuan-ti, Histachii (`86bfc43d-a09f-4541-9217-0ac5e6c763a9`) | name_en |
| Yugoloth, Guardian | Yugoloth, Wächter (`6c68fbc1-87de-4b71-aa42-07ad292fb7c7`) | name_en |
| Zombie | Zombie (`2fb7e1bb-3d99-4df5-9b3d-fd8e64ed2795`) | name_en |

## INSERTs

| Monster (EN) | Source book | Size | HD |
|---|---|---|---|
| Argos | Unknown | L | 5-10 |
| Bat | Unknown | T | 1-2 hp |
| Bear | Unknown | M | 3+3 |
| Cat, Great | Unknown | M | 3 |
| Catoblepas | Unknown | L | 6+2 |
| Deepspawn | Forgotten Realms Campaign Setting, Revised Edition | H | 14 |
| Dog, Moon | Unknown | M | 9+3 |
| Dragon, Cloud | Unknown | G | 14 (base) |
| Elephant | Unknown | L | 11 |
| Frog | Unknown | T | 1-3 |
| Giant, Desert | Unknown | H | 13 |
| Giant, Jungle | Unknown | H | 11 |
| Giant, Reef | Unknown | H | 18 |
| Giff | Unknown | L | 4 |
| Golem IV | Unknown | M | 15 (60 hp) |
| Grell, Colonial | Unknown | M | 5 |
| Heucuva | Unknown | M | 2 |
| Hippocampus | Unknown | H | 4 |
| Horse | Unknown | L | 3 |
| Jackalwere | Unknown | S | 4 |
| Kirre | Unknown | L | 6+6 |
| Lamia | Unknown | M | 9 |
| Lammasu | Unknown | L | 7+7 |
| Leech | Unknown | S | 1-4 |
| Leprechaun | Unknown | T | 2-5 hp |
| Leucrotta | Unknown | L | 6+1 |
| Locathah | Unknown | M | 2 |
| Lycanthrope, General Information | Unknown | M | 1 |
| Lycanthrope, Seawolf | Unknown | M | 2+2 |
| Lycanthrope, Werebear | Unknown | L | 7+3 |
| Lycanthrope, Wereboar | Unknown | M | 5+2 |
| Lycanthrope, Werebat | Unknown | M | 4+2 |
| Lycanthrope, Werefox | Unknown | M | 8+1 |
| Lycanthrope, Wereraven | Unknown | M | 4+2 |
| Lycanthrope, Weretiger | Unknown | M | 6+2 |
| Lycanthrope, Werewolf | Unknown | M | 4+3 |
| Mammal, Small | Unknown | M | 1 |
| Manscorpion | Unknown | L | 8-12 |
| Mephit, General Information | Unknown | M | 1 |
| Morkoth | Unknown | M | 7 |
| Muckdweller | Unknown | T | ½ |
| Mudman | Unknown | S | 2 |
| Mummy, Greater | Unknown | M | 8+3 (base) |
| Myconid | Unknown | T | 1-6 |
| Naga | Unknown | H | 11-12 |
| Nymph | Unknown | M | 3 |
| Octopus, Giant | Unknown | L | 8 |
| Phoenix | Unknown | L | 20 |
| Plant, Dangerous I | Unknown | G | 25 |
| Plant, Intelligent | Unknown | H | 6, +1 hp per year |
| Pudding, Deadly | Unknown | S | 10 |
| Rat | Unknown | T | ¼ |
| Rat, Osquip | Unknown | S | 3+1 |
| Remorhaz | Unknown | G | 7-14 |
| Sea Lion | Unknown | L | 6 |
| Selkie | Unknown | M | 3+3 |
| Skeleton, Giant | Unknown | L | 4+4 |
| Snake | Unknown | M | 6 |
| Sphinx | Unknown | L | 12 |
| Squid, Giant | Unknown | G | 12 |
| Swanmay | Unknown | M | 2 to 12 |
| Tabaxi | Unknown | M | 2 |
| Tarrasque | Unknown | G | 300 hp (approx. 70 HD) |
| Tasloi | Unknown | S | 1 |
| Titan | Unknown | G | 20 |
| Toad, Giant | Unknown | M | 2+4 |
| Triton | Unknown | M | 3 |
| Urchin | Unknown | S | 1+1 |
| Wolf | Unknown | S | 3 |
| Wolfwere | Unknown | M | 5+1 |
| Yeti | Unknown | L | 4+4 |
| Yuan-ti | Unknown | M | 6-9 |
| Zaratan | Unknown | G | 51-70 |

## SKIPPED (defensive duplicate check)

These compendium entries look like they might already exist in the DB under a different name (e.g. German translation). They are NOT inserted to prevent duplicates. If any of these should actually become new rows, add a curated entry to `NAME_OVERRIDES`.

| Compendium (EN) | Existing row it looks like | Existing name_en |
|---|---|---|
| Elemental, Air Kin, Aerial Servant | Luftelemental (12 TW) (`7d185771-221e-4269-8543-497e8737c3d2`) | Air Elemental (12 HD) |
| Elemental, Earth Kin, Sandling | Erdelemental (12 TW) (`79d7f51a-5278-4a6b-8596-4dca881c76ba`) | Earth Elemental (12 HD) |
| Elemental, Water Kin | Wasserelemental (12 TW) (`211b04e7-9c8e-4cdb-acf3-5db68bb6d427`) | Water Elemental (12 HD) |
| Elemental, Water Kin, Water Weird | Wasserelemental (12 TW) (`211b04e7-9c8e-4cdb-acf3-5db68bb6d427`) | Water Elemental (12 HD) |
| Elemental of Chaos, Air/Earth | Erdelemental (12 TW) (`79d7f51a-5278-4a6b-8596-4dca881c76ba`) | Earth Elemental (12 HD) |
| Elemental of Chaos, Fire/Water | Feuerelemental (12 TW) (`288432a5-3ef5-45bc-8819-40d253c17be7`) | Fire Elemental (12 HD) |
| Elemental, Air/Earth | Erdelemental (12 TW) (`79d7f51a-5278-4a6b-8596-4dca881c76ba`) | Earth Elemental (12 HD) |
| Elemental, Fire/Water | Feuerelemental (12 TW) (`288432a5-3ef5-45bc-8819-40d253c17be7`) | Fire Elemental (12 HD) |
| Golem VI (Stone Variants) | Steingolem (`69c96251-dc80-4d09-9218-c6bf08ab1d2c`) | Stone Golem |
| Ooze/Slime/Jelly II | Schleim/Glibber/Gallert I (`c60f9fb8-7e16-4420-9e79-daeab2297f22`) | Ooze/Slime/Jelly I |

## BLOCKED (hard-skipped)

These compendium keys are in `BLOCKED_KEYS` — their DB rows were already removed by a cleanup migration and the backfill must not re-create them.

| Compendium key | Compendium name (EN) |
|---|---|
| `beholde2` | Beholder and Beholder-kin II |
