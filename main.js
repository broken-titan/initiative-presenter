const bc = new BroadcastChannel("initiative");
const initiativeScroller = document.getElementById("initiativeScroller");
const initiativeTable = document.getElementById("initiativeTable");

bc.onmessage = (event) => {
    switch (event.data.action) {
        case "update":
            updateFromSession();
            break;
    }
};

function addCharacter(id = "", name = "", initiative = 0, graphic = "", obscured = false, active = false) {
    let newCharacter = initiativeTable.getElementsByClassName("character")[0].cloneNode(true);
    id = !id ? self.crypto.randomUUID() : id;
    newCharacter.classList.remove("hidden");
    newCharacter.querySelectorAll("input").forEach(function(character) {
        character.value = "";
        character.checked = false;
    });
    newCharacter.querySelector("input[name='id']").value = id;
    newCharacter.querySelector("input[name='name']").value = name;
    newCharacter.querySelector("input[name='initiative']").value = initiative;
    newCharacter.querySelector("input[name='graphic']").value = graphic;
    newCharacter.querySelector("input[name='obscured']").checked = obscured;
    let inputActive = newCharacter.querySelector("input[name='active']");
    inputActive.setAttribute("id", id);
    inputActive.checked = active;
    inputActive.value = id;
    initiativeTable.querySelector("tbody").appendChild(newCharacter);
}

function removeCharacter(character) {
    let parent = character.parentNode.closest(".character");
    parent.remove();
    saveCharactersToSession();
}

function sortCharacters() {
    let characters = getCharactersFromSession();
    characters.sort(function(a, b) {
        a.initiative = parseFloat(a.initiative);
        b.initiative = parseFloat(b.initiative);
        
        if (a.initiative == b.initiative ) {
            return b.name > a.name ? 1 : -1;
        }

        return b.initiative > a.initiative ? 1 : -1;
    });
    
    saveCharactersToSession(characters);
    updateFromSession();
}

function clearCharacters() {
    saveCharactersToSession([]);
    updateFromSession();
}

function saveCharactersToSession(characters = null) {
    if (characters == null) {
        characters = [...document.querySelectorAll("table.initiative-tracker tbody tr")]
        .map(function(input) {
            let id = input.querySelector("input[name='id']").value;
            let name = input.querySelector("input[name='name']").value;
            let initiative = input.querySelector("input[name='initiative']").value;
            let graphic = input.querySelector("input[name='graphic']").value;
            let obscured = input.querySelector("input[name='obscured']").checked;
            
            return {"id": id, "name": name, "initiative": initiative, "graphic": graphic, "obscured": obscured};
        });
    }
    
    localStorage.setItem("initiative", JSON.stringify(characters));
}

function advanceInitiative() {
    let buttons = [...document.querySelectorAll("#initiativeTable input[name='active']")];
    let current = buttons.findIndex(btn => btn.checked);
    
    if (current >= buttons.length - 1) {
        current = 0;
    }
    buttons[(current + 1) % buttons.length].checked = true;

    saveActiveToSession();
}

function getCharactersFromSession() {
    return JSON.parse(localStorage.getItem("initiative")) ?? [];
}

function getCharacterFromSession(id) {
    return JSON.parse(localStorage.getItem("initiative")).find(character => character.id == id) ?? null;
}

function getActiveFromSession() {
    return JSON.parse(localStorage.getItem("active")) ?? null;
}

function getGraphicFromSession() {
    return JSON.parse(localStorage.getItem("graphic")) ?? {"show": false, "url": null};
}

function updateFromSession() {
    let characters = getCharactersFromSession();
    let active = getActiveFromSession();

    if (initiativeScroller) {
        initiativeScroller.innerHTML = "";
    }

    if (initiativeTable) {
        initiativeTable.querySelectorAll("tbody tr.character:not(.hidden)").forEach(element => element.remove());
    }

    characters.forEach(character => {
        if (!!!character.name) {
            return;
        }

        if (initiativeScroller) {
            let newCharacter = document.createElement("li");
            newCharacter.setAttribute("id", character.id);

            let name = character.name;

            if (character.obscured) {
                newCharacter.classList.add("obscured");
                name = "???";
            }
            
            initiativeScroller.appendChild(newCharacter).innerHTML = "<div class='initiative'>" + parseInt(character.initiative) + "</div> <div class='name'>" + name + "</div>";
        }
        
        if (initiativeTable) {
            addCharacter(character.id, character.name, character.initiative, character.graphic, character.obscured);
        }
    });
    
    document.getElementById(active).classList.add("active");
    updateActive();
}

function saveActiveToSession() {
    let active = initiativeTable.querySelector("input[name='active']:checked");
    active = active ? active.value : null;
    localStorage.setItem("active", JSON.stringify(active));
}

function saveGraphicToSession() {
    let url = document.querySelector("input[name='graphic']").value;
    let show = document.querySelector("input[name='graphic-show']").checked;
    localStorage.setItem("graphic", JSON.stringify({"show": show, "url": url}));
}

function updateActive() {
    let active = JSON.parse(localStorage.getItem("active"));

    if (!active) {
        return;
    }

    let current = document.querySelector("#initiativeScroller .active");
    if (current) {
        current.classList.remove("active");
    }

    let activeElement = document.getElementById(active);
    if (activeElement) {
        activeElement.classList.add("active");
        activeElement.checked = true;
    }

    if (initiativeScroller) {
        let activeCharacterData = getCharacterFromSession(active);

        initiativeScroller.style.top = -1 * Math.max(0, (activeElement.offsetTop - 50)) + "px";
        let nextCharacter = activeElement.nextElementSibling;
        let nextCharacterName = "";

        if (nextCharacter) {
            nextCharacterName = nextCharacter.querySelector(".name").innerHTML;
        } else {
            nextCharacterName = initiativeScroller.querySelector("li .name").innerHTML;
        }

        document.getElementById("nextCharacter").querySelector(".name").innerHTML = nextCharacterName;

        let color = stringToColour(activeElement.querySelector(".name").innerHTML);
        color = "linear-gradient(to top left, " + color + "6E, 1%, black) center/cover";
        let background = color;
        
        if (activeCharacterData.graphic && !activeCharacterData.obscured) {
            background += ", url('" + activeCharacterData.graphic + "') top center/cover no-repeat";
        }
        
        document.querySelector("body").style.background = background;
    }
}

function updateGraphic() {    
    if (initiativeScroller) {
        let graphicData = getGraphicFromSession();
        let graphic = document.getElementById("graphic");

        if (graphicData.show) {
            graphic.setAttribute("src", graphicData.url);
            graphic.classList.remove("invisible");
        } else {
            graphic.classList.add("invisible");
        }
    }
}

function clearGraphic() {
    localStorage.setItem("graphic", JSON.stringify({"show": false, "url": url}));
}

const stringToColour = (str) => {
    let hash = 0;
    str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        colour += value.toString(16).padStart(2, '0')
    }

    return colour
};

window.addEventListener("storage",function(event){
    if (event.key == "initiative") {
        updateFromSession();
    }

    if (event.key == "active") {
        updateActive();
    }

    if (event.key == "graphic") {
        updateGraphic();
    }
});

updateFromSession();
window.scrollTo(0, 0);