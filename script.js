"use strict";

//  FORM LOADING
//  1. ADD OPTIONS TO DROP DOWN
//  2. ADDS EVENTS TO BUTTONS AND CHECKBOXES(CHECK)

let revUpQuestionaire = null;

const addOptions = (els, arr) => {
  Array.from(els).forEach((el) => {
    const fragment = document.createDocumentFragment();
    arr.forEach((r) => {
      const option = document.createElement("option");
      option.text = r;
      fragment.append(option);
    });
    el.append(fragment);
  });
};

const updateCheckboxIds = () => {
  Array.from(document.querySelectorAll(".checkbox")).forEach((label, index) => {
    const id = `checkbox${(index + 1).toString().padStart(2, "0")}`;
    label.attributes.for.value = id;
    label.querySelector(".checkbox__input").id = id;
  });
};

const updateButtons = (el) => {
  const buttons = el.querySelectorAll(".button__remove");

  if (buttons.length === 1) {
    buttons[0].disabled = true;
    return;
  }

  Array.from(buttons).forEach((el) => (el.disabled = false));
};

const getNewResponse = () => {
  const parts = Array.from(document.querySelectorAll(".part")).slice(1);
  const getContent = (element, id) =>
    trimValue(element.querySelector(id).textContent);
  const trimValue = (str) =>
    str.replaceAll(/\n+/g, " ").replaceAll(/\s+/g, " ");

  // GET EACH PART
  return parts.map((part) => {
    return {
      // GET THE PART TITLE
      part: getContent(part, ".part__title"),
      // GET EACH QUESTION IN EACH PART
      questions: Array.from(part.querySelectorAll(".question")).map(
        (question) => {
          return {
            // GET THE ACTUAL QUESTION
            question: getContent(question, ".inputs__label"),
            // EACH QUESTIONS CAN HAVE MULTIPLE INPUTS
            // GET THE DIRECT ".inputs" ONLY
            inputs: Array.from(
              question.querySelectorAll(":scope > .inputs")
            ).map((inp, i) => {
              return {
                input: i + 1,
                //GET EACH DIRECT DIV
                response: Array.from(
                  inp.querySelectorAll(":scope > div:not(.buttons)")
                ).map((div) => {
                  // EXCLUDE DIV WITH BUTTON CLASS
                  // IF NOT SUB QUESTIONS GET DATA ID AND AND RESPONSES OTHERWISE FOLLOW SAME STRUCTURE FROM QUESTIONS SCHEMA
                  // EXCEPT THAT EACH SUB-QUESTIONS ONLY HAVE ONE INPUTS
                  // CAN TARGET THE INPUT DIRECTLY
                  if (div.classList.contains("sub-question")) {
                    return {
                      question: getContent(div, ".inputs__label"),
                      answer: Array.from(
                        div.querySelectorAll("input, textarea, select")
                      ).map((el) => {
                        return {
                          question: el.dataset.id,
                          answer:
                            el.type === "checkbox"
                              ? el.checked
                              : trimValue(el.value),
                        };
                      }),
                    };
                  } else {
                    const el = div.querySelector("input, textarea, select");

                    if (!div.classList.contains("buttons")) {
                      return {
                        question: el.dataset.id,
                        answer:
                          el.type === "checkbox"
                            ? el.checked
                            : trimValue(el.value),
                      };
                    }
                  }
                  // SOME WILL HAVE BUTTONS NOT INLCUDED WILL RETURN UNDEFINED, FILTER TO REMOVE FROM THE LIST
                }),
              };
            }),
          };
        }
      ),
    };
  });
};

const loadData = () => {
  let parts = Array.from(document.querySelectorAll(".part")).slice(1);

  // RENDER UI FIRST
  // THERE COULD BE MULTIPLE INPUTS IN EACH QUESTIONS -> EMPLOYERS, EDUCATION, LICENSES
  // BY DEAFUALT ONLY ONE INPUTS PER QUESTION
  parts.forEach((part, partIndex) => {
    const objPart = revUpQuestionaire[partIndex];

    Array.from(part.querySelectorAll(".question")).forEach(
      (question, questionIndex) => {
        const objQuestion = objPart.questions[questionIndex];

        if (objQuestion.inputs.length > 1) {
          const question = document
            .querySelectorAll(".part")
            [partIndex + 1].querySelectorAll(".question")[questionIndex];

          const buttonAdd = question.querySelector(":scope > .buttons");
          const input = question.querySelector(":scope > .inputs");
          // ADD BUTTON IS DISABLED BY DEFAULT, ENABLE IF MORE THAN ONE INPUTS
          const buttonRemove = input.querySelector(".button__remove");
          buttonRemove.disabled = false;

          for (let i = 2; i <= objQuestion.inputs.length; i++) {
            buttonAdd.insertAdjacentElement(
              "beforebegin",
              input.cloneNode(true)
            );
          }
        }
      }
    );
  });

  // REQUERY UPDATED UI
  parts = Array.from(document.querySelectorAll(".part")).slice(1);

  parts.forEach((part, partIndex) => {
    const objPart = revUpQuestionaire[partIndex];

    Array.from(part.querySelectorAll(".question")).forEach(
      (question, questionIndex) => {
        const objQuestion = objPart.questions[questionIndex];

        Array.from(question.querySelectorAll(":scope > .inputs")).forEach(
          (input, inputIndex) => {
            const objInput = objQuestion.inputs[inputIndex];

            Array.from(
              input.querySelectorAll(":scope > div:not(.buttons)")
            ).forEach((div, divIndex) => {
              const objDiv = objInput.response[divIndex];

              if (div.classList.contains("sub-question")) {
                Array.from(
                  div.querySelectorAll("input, textarea, select")
                ).forEach((ist, istIndex) => {
                  const objInput = objDiv.answer[istIndex];

                  if (ist.type === "checkbox") {
                    ist.checked = objInput.answer;
                  } else {
                    ist.value = objInput.answer;
                  }

                  if (ist.type === "selectone" && objInput.answer === "")
                    ist.options[0].selected = true;
                });
              } else {
                if (!div.classList.contains("buttons")) {
                  const objDiv = objInput.response[divIndex];
                  const ist = div.querySelector("input, textarea, select");

                  if (ist.type === "checkbox") {
                    ist.checked = objDiv.answer;
                  } else {
                    ist.value = objDiv.answer;
                  }
                }
              }
            });
          }
        );
      }
    );
  });
};

const getPosition = async () => {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

const submitResponse = async () => {
  const button = document.querySelector(".button__submit");
  button.classList.add("button--loading");
  button.disabled = true;

  try {
    const position = await getPosition();
    const location = `${position.coords.latitude},${position.coords.longitude}`;

    const formData = new FormData();

    formData.append(
      "data",
      JSON.stringify({
        content: revUpQuestionaire,
        location: location,
      })
    );

    const url = `https://script.google.com/macros/s/AKfycbz0yBnh4fDjeYp3J4gFgq5jViBtLLU9Cw8E52PwtG-HmyN7OAUMWj4AJdBSbka16sMtlA/exec`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const content = await response.json();
    console.log(JSON.parse(content.data));
  } catch (err) {
    console.log(err.message);
  } finally {
    button.classList.remove("button--loading");
    button.disabled = false;
  }
};

const initForm = () => {
  const parts = document.querySelectorAll(".part");
  const form = document.querySelector(".form__body");
  const save = document.querySelector(".floating-button");
  const bottombar = document.querySelector(".bottombar");
  const bottomBarContinue = bottombar.querySelector(".bottombar__continue");
  const bottomBarCancel = bottombar.querySelector(".bottombar__cancel");
  const saveConfirmed = () => {
    revUpQuestionaire = getNewResponse();
    console.log(revUpQuestionaire);

    localStorage.setItem(
      "revUpQuestionaire",
      JSON.stringify(revUpQuestionaire)
    );
  };

  // VALIDATION;
  const validateInputs = () => {
    return Array.from(
      document.querySelectorAll(
        "input[required], textarea[required],select[required]"
      )
    ).reduce((acc, el) => {
      if (el.value.replaceAll(/\s+/g, "") === "") {
        el.classList.add("input--error");
        return acc + 1;
      } else {
        return acc + 0;
      }
    }, 0);
  };

  //ADD OPTIONS TO YEAR
  const optionsYear = document.querySelectorAll(".inputs__select.year");
  const years = Array.from(
    { length: 15 },
    (_, i) => new Date().getFullYear() - i
  );
  addOptions(optionsYear, years);

  // ADD OPTIONS TO MONTHS
  const optionsMonth = document.querySelectorAll(".inputs__select.month");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  addOptions(optionsMonth, months);

  // EVENTS
  form.addEventListener("click", (e) => {
    // NO ID'S - BUBBLE AND PROGATE EVENTS
    // CHANGE VALUE TO DEFAULT

    // DISABLE END DATE OPTIONS
    if (e.target.closest(".isCurrentEmployer")) {
      const isChecked = e.target
        .closest(".checkbox")
        .querySelector("input").checked;

      const selects = e.target
        .closest(".inputs")
        .querySelectorAll(".dates")[1]
        .querySelectorAll("select");

      Array.from(selects).forEach((el) => {
        el.disabled = isChecked;
        if (isChecked) {
          el.options[0].selected = true;
          // REMOVE REQUIRED ATTRIBUTE IF CURRENT EMPLOYER
          el.required = false;
        } else {
          el.required = true;
        }
      });

      return;
    }

    // ADD NEW INPUTS
    // UPDATE CHECK IDS
    if (e.target.closest(".button__add")) {
      e.preventDefault();

      const button = e.target.closest(".buttons");
      const el = button.previousElementSibling.cloneNode(true);

      Array.from(el.querySelectorAll("input, select, textarea")).forEach(
        (input) => {
          input.classList.remove("input--error");
          if (input.type === "text" || input.type === "textarea")
            input.value = "";
          if (input.type === "checkbox") input.checked = false;
          if (input.type === "select-one") input.options[0].selected = true;
        }
      );

      button.insertAdjacentElement("beforebegin", el);

      updateCheckboxIds();
      updateButtons(button.closest(".question"));

      return;
    }

    // REMOVE INPUTS
    if (e.target.closest(".button__remove")) {
      const button = e.target.closest(".buttons");
      const question = button.closest(".question");
      const inputs = question.querySelectorAll(".inputs");

      if (inputs.length > 1) {
        button.closest(".inputs").remove();
      }

      updateButtons(question);

      return;
    }

    // CLEAR INPUTS
    // GET ALL QUESTIONS -> GET ALL INPUTS  (ONLY ONE INPUTS PER QUESTIONS) -> DELETE OTHER INPUTS
    // CLEAR ALL INPUT
    if (e.target.closest(".button__clear")) {
      let questions = e.target
        .closest(".part__content")
        .querySelectorAll(".question");

      Array.from(questions).forEach((question) => {
        const inputs = question.querySelectorAll(".inputs");

        for (let i = inputs.length - 1; i > 0; i--) {
          inputs[i].remove();
        }

        updateButtons(question);
      });

      const inputs = e.target
        .closest(".part__content")
        .querySelectorAll("input, textarea, select");

      Array.from(inputs).forEach((input) => {
        console.log(input.type);
        if (input.type === "checkbox") {
          input.checked = false;
        } else {
          input.value = "";
        }

        if (input.type === "selectone") input.options[0].selected = true;
      });

      return;
    }

    if (e.target.closest(".button__submit")) {
      console.log(validateInputs());

      if (validateInputs() !== 0) {
        window.alert("Please fill-out all required fields");
        return;
      }

      //POST HERE
      saveConfirmed();
      submitResponse();
    }
  });

  form.addEventListener("change", (e) => {
    // e.target.classList.contains("input[required]") ||
    // e.target.classList.contains("select[required]") ||
    // e.target.classList.contains("textarea[required]");
    const el = e.target;
    // REMOVE ALL SPACES AND NEW LINE TO VERIFY CONTENT
    const trimValue = (str) =>
      str.replaceAll(/\n+/g, "").replaceAll(/\s+/g, "");
    let format = null;

    if (el.attributes.required != undefined) {
      const dataId = el.getAttribute("data-id");

      if (dataId === "email") {
        format =
          /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/gi;

        if (format.test(trimValue(el.value))) {
          el.classList.remove("input--error");
        } else {
          window.alert("Please enter a valid email");
          el.classList.add("input--error");
        }
        return;
      }

      if (dataId === "mobileNumber") {
        format = /(^0[1-9])(\d{4})(\d{4}$)/;

        if (format.test(trimValue(el.value))) {
          el.classList.remove("input--error");
          el.value = trimValue(el.value).toString().replace(format, "$1 $2 $3");
        } else {
          window.alert(
            "Please enter the two-digit area code + the eight-digit mobile number"
          );
          el.classList.add("input--error");
        }
        return;
      }

      if (dataId === "industryExperience" || dataId === "jobExperience") {
        format = /^.{1,}/;

        if (format.test(trimValue(el.value))) {
          el.classList.remove("input--error");
        } else {
          window.alert("This information is required");
          el.classList.add("input--error");
        }
        return;
      }

      format = /^.{3,}/;

      if (format.test(trimValue(el.value))) {
        el.classList.remove("input--error");
      } else {
        window.alert("This information is required");
        el.classList.add("input--error");
      }

      console.log(!document.querySelector(".test"));
    }
  });

  save.addEventListener("click", (e) => {
    if (!localStorage.getItem("revUpQuestionaire")) {
      bottombar.classList.add("bottombar--visible");
    } else {
      saveConfirmed();
    }
  });

  bottomBarContinue.addEventListener("click", (e) => {
    saveConfirmed();
    bottombar.classList.remove("bottombar--visible");
  });

  bottomBarCancel.addEventListener("click", (e) => {
    bottombar.classList.remove("bottombar--visible");
  });

  if (localStorage.getItem("revUpQuestionaire")) {
    revUpQuestionaire = JSON.parse(localStorage.getItem("revUpQuestionaire"));
    loadData();
  }
};

document.addEventListener("DOMContentLoaded", initForm);
// const { latitude: lat, longitude: lng } = position.coords;
