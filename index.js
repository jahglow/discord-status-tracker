/**
 * Discord friends status tracking script
 * call this in discord web version -> friends tab -> All.
 *
 * Launch and report scripts can be assigned to bookmarks
 * e.g. `javascript:window.discordPresence.report()`
 * */
(function (w, d) {
  function print(url, info) {
    var image = new Image();
    image.onload = function () {
      var style = [
        "font-size: 1px;",
        "padding: 12px;",
        "border-radius: 50%;",
        "background: url(" + url + ") no-repeat;",
        "background-size: cover;",
      ].join(" ");
      console.log("%c " + `%c ${info}`, style, "font-size:16");
    };
    image.src = url;
  }

  const qs = (name, node = d, prefix = "div") =>
    node.querySelector(`${prefix}[class^=${name}]`);
  const lsName = "presenceStats";

  const store = { first: undefined, last: undefined, tracking: {} };

  function scrubData() {
    const peopleList = qs("peopleList");
    const data = {};
    for (const user of [
      ...peopleList.querySelectorAll("[class^=peopleListItem]"),
    ]) {
      const uid = user.getAttribute("data-list-item-id");
      const infoNode = qs("userInfo", user);
      const avatarNode = qs("avatar", infoNode);
      const [name, status] = avatarNode.getAttribute("aria-label").split(", ");
      const avatar = qs("avatar", avatarNode, "img").getAttribute("src");
      data[uid] = { uid, name, status, avatar };
    }
    return data;
  }

  function update(timestamp) {
    const data = scrubData();
    Object.keys(data).forEach((k) => {
      const { uid, name, avatar, status } = data[k];
      store.tracking[uid] = store.tracking[uid] || {
        uid,
        name,
        avatar,
        status: [],
      };
      const storeItem = store.tracking[uid];
      const lastStatus = storeItem.status[storeItem.status.length - 1];
      if (!(lastStatus && lastStatus.status === status)) {
        if (lastStatus && status === "Idle") {
          //subtract idle time
          lastStatus.timestamp -= 10000;
        }
        storeItem.status.push({ timestamp, status });
      }
    });
  }

  function start() {
    function handleUpdate() {
      const date = new Date().getTime();
      if (!store.first) store.first = date;
      store.last = date;
      update(date);
    }

    handleUpdate();
    setInterval(handleUpdate, 15000);
  }

  function iterateUser(status) {
    const result = status.reverse().reduce(
      (acc, status) => {
        const delta = Math.floor((acc.last - status.timestamp) / 1000);
        acc.distinct[status.status] =
          (acc.distinct[status.status] || 0) + delta;
        acc.last = status.timestamp;
        return acc;
      },
      { last: store.last, distinct: {} }
    );
    return `Статусы: ${Object.keys(result.distinct)
      .map(
        (k) =>
          `${k} - ${new Date(1000 * result.distinct[k])
            .toISOString()
            .substr(11, 5)}ч.`
      )
      .join("; ")}`;
  }

  function report() {
    console.log(
      `Начало: ${new Date(
        store.first
      ).toLocaleTimeString()}; Последняя запись: ${new Date(
        store.last
      ).toLocaleTimeString()}`
    );

    Object.keys(store.tracking).forEach((k) => {
      const user = store.tracking[k];
      print(
        user.avatar,
        `${user.name} (${
          user.status[user.status.length - 1].status
        })\n${iterateUser(user.status)}`
      );
    });
  }

  /**
   * call this to get a report to console
   */
  window.discordPresence = report;
  start();
})(window, document);
