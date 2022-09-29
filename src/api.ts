export const makeApiCalls = async (userData: string) => {
  try {
    const localData = JSON.parse(userData);
    console.log(userData);
    const myHeaders = new Headers();
    myHeaders.append(
      "validateReq",
      localData.ValidateReq 
    );
    // myHeaders.append("userid", userId);

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    let total = 0;
    let number = 0;
    let quantity = 0;
    while (1) {
      const response = await fetchWrrapper(
        `https://services.mcdelivery.co.in/api/order/getmyorderslist?CustomerID=${localData.CustomerID}`,
        requestOptions
      );
      const data = JSON.parse(response);

      data.data.orderListingData.forEach(
        (rows: { TotalOrderAmount: string; OrderStatus: string }) => {
          if (rows.OrderStatus === "Completed") {
            let value = rows.TotalOrderAmount.slice(2);
            total += parseInt(value);
            quantity++;
          }
        }
      );
      console.log(quantity, total);
      if ("link" in data) {
        number++;
      } else {
        break;
      }
    }

    return { total, quantity };
  } catch (e) {
    console.log(e);
    throw new Error("Error while making api calls to McDonalds");
  }
};

const fetchWrrapper = async (url: string, options: RequestInit) => {
  return fetch(url, options)
    .then((response) => {
      return response.text();
    })
    .catch((_) => {
      return "";
    });
};
