// @ts-nocheck
(() => {
  const currentProfile = {};
  console.log('Yo ho ho this is the content script calling');
  const onMessageHandler = (obj, sender, response) => {
    const { type, value, linkedInProfileId, message } = obj;
    console.log('got message', { type, value, linkedInProfileId, message });

    if (type === 'NEW') {
      newProfileLoaded(linkedInProfileId);
    }
    if (type === 'GET_PROFILE') {
      getProfile(linkedInProfileId);
    }
    if (type === 'SAVE_POSITION') {
      savePosition(message);
    }
    if (type === 'SET_MESSAGE') {
      setGeneratedMessage(message);
    }
  };

  chrome.runtime.onMessage.addListener(onMessageHandler);

  const getPositionFromStorage = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get('position', (obj) => {
        resolve(obj['position'] ? JSON.parse(obj['position']) : '');
      });
    });
  };

  const savePosition = (message) => {
    chrome.storage.local.set({ 'position': message });
  };

  const newProfileLoaded = (linkedInProfileId) => {
    const [userName] = document.getElementsByTagName('h1');
    currentProfile.profileId = linkedInProfileId;
    currentProfile.name = userName.innerText;

    chrome.storage.local.set({
      'currentProfile': JSON.stringify(currentProfile),
    });
  };

  const getProfile = (linkedInProfileId) => {
    const [userName] = document.getElementsByTagName('h1');
    currentProfile.profileId = decodeURIComponent(
      linkedInProfileId.replace('/', '')
    );
    currentProfile.name = userName.innerText;
    currentProfile.about = getAbout();
    currentProfile.experience = getExperience();
    currentProfile.education = getEducation();
    chrome.storage.local.set(
      {
        'currentProfile': JSON.stringify(currentProfile),
      },
      () => {
        if (chrome.runtime.lastError) {
            console.log('in getProfile', chrome.runtime.lastError);
        } else {
            console.log('saved profile locally', currentProfile)
        }
      }
    );
  };

  const getAbout = () => {
    const siblings = getSiblingsById('about');
    return getDeepestSpanInnerText(siblings[1]);
  };

  const getSiblingsById = (elementId) => {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) {
      console.error(`Element with ID '${elementId}' not found.`);
      return [];
    }

    const parentElement = targetElement.parentNode;
    return Array.from(parentElement.children).filter(
      (child) => child !== targetElement
    );
  };

  const getDeepestSpanInnerText = (element) => {
    let deepestSpan = null;
    let maxDepth = -1;

    function traverse(element, depth) {
      if (element.tagName === 'SPAN' && depth > maxDepth) {
        deepestSpan = element;
        maxDepth = depth;
      }

      const children = element.children;
      for (let i = 0; i < children.length; i++) {
        traverse(children[i], depth + 1);
      }
    }

    traverse(element, 0);

    return deepestSpan ? deepestSpan.innerText : '';
  };

  const getExperience = () => {
    const expContainer = getSiblingsById('experience')[1];
    return getSpansTexts(expContainer);
  };

  const getEducation = () => {
    const eduContainer = getSiblingsById('education')[1];
    return getSpansTexts(eduContainer);
  };

  const getSpansTexts = (parentElement) => {
    const allSpans = parentElement.querySelectorAll('span');
    const spanTexts = [];

    allSpans.forEach((span) => {
      const text = span.innerText.trim();
      if (text.length > 0) {
        spanTexts.push(text);
      }
    });

    return spanTexts;
  };

  const sendPost = async (data) => {
    const response = await fetch(
      'https://sw7blq3c19.execute-api.us-east-1.amazonaws.com/production/save-candidate',
      {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
  };

  const handleSendMessageFromLinkedin = () => {
    const sendMessageLinkedInButton = document.getElementsByClassName(
      'msg-form__send-button'
    )[0];
    const sendMessageHandler = async () => {
      const url = document.location.href;
      const position = await getPositionFromStorage();
      const data = {
        json: JSON.stringify(currentProfile),
        url: url,
        position: position.position,
      };
      await sendPost(data);
      console.log(
        `Sending profile ${JSON.stringify(currentProfile)} to backend`
      );
    };

    sendMessageLinkedInButton.addEventListener('click', sendMessageHandler);
  };

  const openChat = () => {
    const buttons = document.querySelectorAll('button');

    // Filter buttons to find the one with an aria-label that starts with "Message"
    const messageButton = Array.from(buttons).find(
      (button) =>
        button.getAttribute('aria-label') &&
        button.getAttribute('aria-label').startsWith('Message')
    );

    if (messageButton) {
      messageButton.click();
      console.log('Message button found:', messageButton);
    } else {
      console.log('Message button not found');
    }
  };

  function insertMessage(message) {
    const editableDiv = document.querySelector(
      'div.msg-form__contenteditable[contenteditable="true"][aria-label="Write a message…"]'
    );

    if (editableDiv) {
      const placeholder = editableDiv.nextElementSibling;

      placeholder.classList.remove('msg-form__placeholder');
      editableDiv.innerHTML = `<p>${message}</p>`;

      editableDiv.focus();
      if (
        typeof window.getSelection != 'undefined' &&
        typeof document.createRange != 'undefined'
      ) {
        var range = document.createRange();
        range.selectNodeContents(editableDiv);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }

      var event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });
      editableDiv.dispatchEvent(event);
    } else {
      console.log('Editable div not found');
    }
  }

  function setGeneratedMessage(message) {
    console.log('Opening chat');
    openChat();
    console.log('Setting message');
    setTimeout(() => {
      insertMessage(message);
    }, 500);
  }
})();
