
const recordStores = [
  {
    name: "Underground Sounds",
    rating: "3/5",
    lat: 42.2810,
    lng: -83.7473,
    address: "120 E Washington St, Ann Arbor, MI 48104",
    notes:
      "Not quite as pricey as Encore, but they mainly have new records. They randomly had a few Habibi Funk albums, Frank Ocean, and Fairuz — stuff you can only get overseas. Owner was pretty eager to take my recommendations on what albums to order for the store."
  },
  {
    name: "Wazoo Records",
    rating: "4/5",
    lat: 42.2769,
    lng: -83.7415,
    address: "336 S State St, Ann Arbor, MI 48104",
    notes:
      "It’s pretty cramped and tiny but great for looking through used goods. I find a gem every once in a while. Most affordable one in Ann Arbor. Guy who owns it is fun to talk to about music too."
  },
  {
    name: "Encore Records",
    rating: "4/5",
    lat: 42.2837,
    lng: -83.7485,
    address: "208 N 4th Ave, Ann Arbor, MI 48104",
    notes:
      "Usually a great and wide selection, especially with jazz. Super expensive, though."
  },
  {
    name: "People's Records",
    rating: "6/5!!",
    lat: 42.36517,
    lng: -83.06571,
    address: "1464 Gratiot Ave, Detroit, MI 48207",
    notes:
      "My favorite place to explore and buy records! Such a great collection of jazz, electronic/dance, soul — anything really. Lots of local music too. You can find rare recordings you didn’t even know existed, all for affordable prices. Very accessible and connected to a cafe that I love as well. Highly recommended!"
  },
  {
    name: "UHF Records",
    rating: "4/5",
    lat: 42.4902,
    lng: -83.1445,
    address: "512 S Washington Ave, Royal Oak, MI 48067",
    notes:
      "I don’t get out here often because of the location, but they have some great finds. The new stuff can be pretty expensive, though. I did find some Frank Ocean albums I had been looking for for a few years, and a used Aretha Franklin find."
  },
  {
    name: "Detroit Record Club",
    rating: "2/5",
    lat: 42.4890,
    lng: -83.1448,
    address: "28834 Woodward Ave, Royal Oak, MI 48067",
    notes:
      "Small and expensive for no reason. I have only been once and didn’t really like the vibe in there."
  },
  {
    name: "Flipside Records",
    rating: "4/5",
    lat: 42.4975,
    lng: -83.1825,
    address: "3099 Coolidge Hwy, Berkley, MI 48072",
    notes:
      "Huge selections, fun to walk around and explore. Fair prices and the used vinyl is in good shape."
  },
  {
    name: "Solo Records & Tapes",
    rating: "4/5",
    lat: 42.5130,
    lng: -83.1820,
    address: "30148 Woodward Ave, Royal Oak, MI 48073",
    notes:
      "I found a lot of great jazz albums here. I also found one of my favorite records by chance here. Fantastic prices, but you gotta check that the records aren’t scratched before buying."
  },
  {
    name: "Found Sound",
    rating: "3/5",
    lat: 42.46237,
    lng: -83.13602,
    address: "234 W Nine Mile Rd, Ferndale, MI 48220",
    notes:
      "Extensive selection, mixed prices depending on what you’re looking for. I haven’t spent too much time in here."
  },
  {
    name: "Your Media Exchange",
    rating: "1/5",
    lat: 42.2790,
    lng: -83.7480,
    address: "319 S Main St, Ann Arbor, MI 48104 (now closed)",
    notes:
      "While it’s true that they had an extensive selection, everything was overpriced for no reason. Take your average price for a new record and inflate it. I think this store recently closed for good now, though."
  }
];



let map;
let infoWindow;
let markers = [];

function initMap() {

  const center = { lat: 42.38, lng: -83.25 };

  map = new google.maps.Map(document.getElementById("record-store-map"), {
    center,
    zoom: 10
  });

  infoWindow = new google.maps.InfoWindow();

  recordStores.forEach((store, index) => {
    const marker = new google.maps.Marker({
      position: { lat: store.lat, lng: store.lng },
      map,
      title: store.name
    });

    marker.addListener("click", () => {
      const content = `
        <div style="font-family: system-ui, sans-serif; font-size: 14px; max-width: 240px;">
          <strong style="font-size:15px;">${store.name}</strong><br/>
          <span>${store.rating || ""}</span><br/>
          <span>${store.address}</span><br/>
          <em style="font-size:13px; display:block; margin-top:4px;">
            ${store.notes || ""}
          </em>
        </div>
      `;
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
    });

    markers.push(marker);
  });

  buildStoreList();
}

function buildStoreList() {
  const listEl = document.getElementById("store-list");
  if (!listEl) return;

  recordStores.forEach((store, index) => {
    const card = document.createElement("article");
    card.className = "store-card";

    card.innerHTML = `
      <h3>${store.name}</h3>
      <p class="store-rating">
        <strong>Rating:</strong> ${store.rating || ""}
      </p>
      <p class="store-address">${store.address}</p>
      <p class="store-notes">${store.notes || ""}</p>
    `;

    card.addEventListener("click", () => {
      const marker = markers[index];
      if (!marker) return;


      map.panTo(marker.getPosition());
      map.setZoom(13);

      const content = `
        <div style="font-family: system-ui, sans-serif; font-size: 14px; max-width: 240px;">
          <strong style="font-size:15px;">${store.name}</strong><br/>
          <span>${store.rating || ""}</span><br/>
          <span>${store.address}</span><br/>
          <em style="font-size:13px; display:block; margin-top:4px;">
            ${store.notes || ""}
          </em>
        </div>
      `;
      infoWindow.setContent(content);
      infoWindow.open(map, marker);

      card.classList.toggle("is-open");
    });

    listEl.appendChild(card);
  });
}
