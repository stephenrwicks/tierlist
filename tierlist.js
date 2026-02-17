"use strict";
const TIERLIST = (data) => {
    const TierList = {
        name: '',
        get tiers() {
            const result = [];
            for (const child of main.children) {
                const item = TIERS.find(x => x.containerDiv === child);
                if (!item)
                    continue;
                result.push(item);
            }
            return result;
        },
        set tiers(tiers) {
        },
        get element() {
            return WRAPPER;
        },
    };
    const WRAPPER = document.createElement('div');
    WRAPPER.className = 'sw-tier-list sw-theme';
    const TIERS = [];
    const ITEMSET = new Set();
    const Tier = (_NAME = '', _ITEMS = []) => {
        const containerDiv = document.createElement('div');
        const _TIERBUTTON = document.createElement('button');
        _TIERBUTTON.type = 'button';
        _TIERBUTTON.textContent = _NAME;
        _TIERBUTTON.addEventListener('dblclick', async () => {
            const n = await editTier();
            if (!n)
                return;
            _TIER.name = n;
        });
        const placeholder = document.createElement('div');
        placeholder.style.border = '1px dashed var(--color500)';
        const dropPlaceholder = (e) => {
            let closest = { el: null, distanceY: Number.MAX_SAFE_INTEGER };
            let method = 'before';
            for (const el of main.children) {
                if (el === containerDiv || el === placeholder)
                    continue;
                const rect = el.getBoundingClientRect();
                const height = rect.top - rect.bottom;
                const distanceY = Math.abs(height / 2 + rect.top - e.clientY);
                if (distanceY < closest.distanceY) {
                    closest = { el, distanceY };
                    const distanceToTop = Math.abs(rect.top - e.clientY);
                    const distanceToBottom = Math.abs(rect.bottom - e.clientY);
                    method = distanceToTop < distanceToBottom ? 'before' : 'after';
                }
            }
            if (closest.el instanceof Element)
                closest.el[method](placeholder);
        };
        let offsetY = 0;
        let lastWidth = '';
        const handleDown = (e) => {
            e.preventDefault();
            _TIERBUTTON.focus();
            const rect = containerDiv.getBoundingClientRect();
            lastWidth = `${rect.width}px`;
            offsetY = e.clientY - rect.top;
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp, { once: true });
        };
        const handleMove = (e) => {
            containerDiv.style.minWidth = lastWidth;
            containerDiv.style.maxWidth = lastWidth;
            containerDiv.style.position = 'absolute';
            containerDiv.style.top = `${e.clientY - offsetY + window.scrollY}px`;
            containerDiv.classList.add('drag');
            dropPlaceholder(e);
        };
        const handleUp = () => {
            placeholder.replaceWith(containerDiv);
            containerDiv.style.minWidth = '';
            containerDiv.style.position = '';
            containerDiv.style.top = '';
            containerDiv.classList.remove('drag');
            window.removeEventListener('pointermove', handleMove);
        };
        _TIERBUTTON.addEventListener('pointerdown', handleDown);
        const dropDiv = document.createElement('div');
        dropDiv.className = 'drop';
        const currentItems = new Set(_ITEMS);
        containerDiv.replaceChildren(_TIERBUTTON, dropDiv);
        dropDiv.addEventListener('add-item', (e) => {
            e.stopPropagation();
            const item = e.detail;
            currentItems.add(item);
        });
        dropDiv.addEventListener('remove-item', (e) => {
            e.stopPropagation();
            const item = e.detail;
            currentItems.delete(item);
        });
        const editTier = () => {
            const { promise, resolve } = Promise.withResolvers();
            const dialog = document.createElement('dialog');
            const id = `_${crypto.randomUUID()}`;
            const label = document.createElement('label');
            label.htmlFor = id;
            label.textContent = 'Tier Name';
            const input = document.createElement('input');
            input.id = id;
            input.type = 'text';
            input.maxLength = 30;
            input.required = true;
            input.pattern = '^(?=.*\\S).+$';
            input.value = _NAME;
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'input-wrapper';
            inputWrapper.replaceChildren(label, input);
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                dialog.remove();
                resolve(null);
            });
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'OK';
            const buttonRow = document.createElement('div');
            buttonRow.className = 'button-row';
            buttonRow.replaceChildren(cancelButton, submitButton);
            const content = document.createElement('div');
            content.className = 'form-content form-content-tier';
            content.replaceChildren(inputWrapper);
            const form = document.createElement('form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                dialog.remove();
                const newName = input.value?.trim();
                if (!newName) {
                    resolve(null);
                    return;
                }
                _TIER.name = newName;
                resolve(newName);
            });
            cancelButton.addEventListener('click', () => {
                dialog.remove();
                resolve(null);
            });
            dialog.addEventListener('cancel', () => {
                dialog.remove();
                resolve(null);
            });
            form.replaceChildren(content, buttonRow);
            dialog.replaceChildren(form);
            WRAPPER.append(dialog);
            dialog.showModal();
            return promise;
        };
        _TIERBUTTON.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                editTier();
            }
        });
        const _TIER = {
            get name() {
                return _NAME;
            },
            set name(n) {
                _NAME = n;
                _TIERBUTTON.textContent = _NAME;
            },
            containerDiv,
            editTier,
            get items() {
                const result = [];
                const values = [...currentItems.values()];
                for (const child of dropDiv.children) {
                    const item = values.find(x => x.containerButton === child);
                    if (!item)
                        continue;
                    result.push(item);
                }
                return result;
            }
        };
        for (const initItem of currentItems) {
            dropDiv.append(initItem.containerButton);
        }
        return _TIER;
    };
    const Item = (_NAME = '', _SRC = '') => {
        const _ITEMBUTTON = document.createElement('button');
        _ITEMBUTTON.type = 'button';
        _ITEMBUTTON.className = 'item';
        const _image = document.createElement('img');
        const _textDiv = document.createElement('div');
        _ITEMBUTTON.replaceChildren(_image, _textDiv);
        const placeholder = document.createElement('div');
        placeholder.className = 'item placeholder';
        let offsetX = 0;
        let offsetY = 0;
        const dropPlaceholder = (e) => {
            const elementsFromPoint = document.elementsFromPoint(e.clientX, e.clientY);
            const parent = elementsFromPoint.find(el => el.classList.contains('drop'));
            if (!parent)
                return unusedItemsRow.append(placeholder);
            if (!parent.children.length) {
                parent.append(placeholder);
                return;
            }
            let closest = { el: null, distanceX: Number.MAX_SAFE_INTEGER };
            let closestY = Number.MAX_SAFE_INTEGER;
            let method = 'before';
            for (const el of parent.children) {
                if (el === _ITEMBUTTON || el === placeholder)
                    continue;
                const rect = el.getBoundingClientRect();
                const width = rect.right - rect.left;
                const height = rect.top - rect.bottom;
                const distanceX = Math.abs(width / 2 + rect.left - e.clientX);
                const distanceY = Math.abs(height / 2 + rect.top - e.clientY);
                if (closestY < distanceY)
                    continue;
                closestY = distanceY;
                if (distanceX < closest.distanceX) {
                    closest = { el, distanceX };
                    const distanceToRight = Math.abs(rect.right - e.clientX);
                    const distanceToLeft = Math.abs(rect.left - e.clientX);
                    method = distanceToRight > distanceToLeft ? 'before' : 'after';
                }
            }
            closest.el instanceof Element ? closest.el[method](placeholder) : parent.append(placeholder);
        };
        const handleDown = (e) => {
            e.preventDefault();
            _ITEMBUTTON.focus();
            const rect = _ITEMBUTTON.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp, { once: true });
        };
        const handleMove = (e) => {
            _ITEMBUTTON.dispatchEvent(new CustomEvent('remove-item', { bubbles: true, detail: _ITEM }));
            _ITEMBUTTON.style.position = 'absolute';
            _ITEMBUTTON.style.left = `${e.clientX - offsetX + window.scrollX}px`;
            _ITEMBUTTON.style.top = `${e.clientY - offsetY + window.scrollY}px`;
            _ITEMBUTTON.classList.add('drag');
            dropPlaceholder(e);
        };
        const handleUp = () => {
            placeholder.replaceWith(_ITEMBUTTON);
            _ITEMBUTTON.dispatchEvent(new CustomEvent('add-item', { bubbles: true, detail: _ITEM }));
            _ITEMBUTTON.style.position = '';
            _ITEMBUTTON.style.left = '';
            _ITEMBUTTON.style.top = '';
            _ITEMBUTTON.classList.remove('drag');
            window.removeEventListener('pointermove', handleMove);
        };
        const editItem = () => {
            const { promise, resolve } = Promise.withResolvers();
            const imageClone = _image.cloneNode();
            const dialog = document.createElement('dialog');
            const form = document.createElement('form');
            const addImageButton = document.createElement('button');
            addImageButton.type = 'button';
            addImageButton.textContent = 'Select Image';
            addImageButton.className = 'add-image-button';
            addImageButton.addEventListener('click', async () => {
                const newSource = await imagePrompt();
                if (newSource === null && !imageClone.src) {
                    submitButton.disabled = true;
                    return;
                }
                else if (newSource === null) {
                    return;
                }
                imageClone.src = newSource;
                submitButton.disabled = false;
                input.focus();
            });
            const clearImageButton = document.createElement('button');
            clearImageButton.type = 'button';
            clearImageButton.textContent = 'Clear';
            clearImageButton.className = 'clear-image-button';
            clearImageButton.addEventListener('click', () => {
                submitButton.disabled = true;
                input.value = '';
                imageClone.src = '';
            });
            const id = `_${crypto.randomUUID()}`;
            const label = document.createElement('label');
            label.htmlFor = id;
            label.textContent = 'Name';
            const input = document.createElement('input');
            input.id = id;
            input.type = 'text';
            input.maxLength = 30;
            input.required = true;
            input.pattern = '^(?=.*\\S).+$';
            input.autofocus = true;
            input.value = _ITEM.name;
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'input-wrapper';
            inputWrapper.replaceChildren(label, input);
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                dialog.remove();
                resolve(null);
            });
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'OK';
            submitButton.disabled = !_ITEM.name || !_image.src;
            const deleteItemButton = document.createElement('button');
            deleteItemButton.type = 'button';
            deleteItemButton.textContent = 'Delete';
            deleteItemButton.style.marginRight = 'auto';
            deleteItemButton.addEventListener('click', () => {
                _ITEMBUTTON.dispatchEvent(new CustomEvent('remove-item', { detail: _ITEM }));
                _ITEM.deleteThis();
                dialog.remove();
                resolve(null);
            });
            dialog.addEventListener('cancel', () => {
                dialog.remove();
                resolve(null);
            });
            const content = document.createElement('div');
            content.className = 'form-content form-content-item';
            content.replaceChildren(addImageButton, imageClone, inputWrapper, clearImageButton);
            const buttonRow = document.createElement('div');
            buttonRow.className = 'button-row';
            buttonRow.replaceChildren(cancelButton, submitButton);
            if (ITEMSET.has(_ITEM))
                buttonRow.prepend(deleteItemButton);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                dialog.remove();
                const inputValue = input.value.trim();
                if (!imageClone.src || !inputValue) {
                    resolve(null);
                    return;
                }
                _ITEM.name = inputValue;
                _ITEM.src = imageClone.src;
                resolve(_ITEM);
            });
            dialog.addEventListener('cancel', () => {
                dialog.remove();
                resolve(null);
            });
            form.replaceChildren(content, buttonRow);
            dialog.replaceChildren(form);
            WRAPPER.append(dialog);
            dialog.showModal();
            return promise;
        };
        _ITEMBUTTON.addEventListener('pointerdown', handleDown);
        _ITEMBUTTON.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                editItem();
            }
            else if (e.key === 'Delete') {
                e.preventDefault();
                _ITEM.deleteThis();
            }
        });
        _ITEMBUTTON.addEventListener('click', () => _ITEMBUTTON.focus());
        _ITEMBUTTON.addEventListener('dblclick', editItem);
        const _ITEM = {
            containerButton: _ITEMBUTTON,
            get name() {
                return _NAME;
            },
            set name(name) {
                _NAME = name.trim();
                _textDiv.textContent = _NAME;
            },
            get img() {
                return _image;
            },
            get src() {
                return _image.src ?? '';
            },
            set src(src) {
                _image.src = src;
            },
            editItem,
            addThis() {
                ITEMSET.add(this);
                unusedItemsRow.append(_ITEMBUTTON);
            },
            deleteThis() {
                _ITEMBUTTON.remove();
                ITEMSET.delete(this);
            },
        };
        _ITEM.name = _NAME;
        _ITEM.src = _SRC;
        return _ITEM;
    };
    TIERS.push(...['S', 'A', 'B', 'F'].map(t => Tier(t)));
    const main = document.createElement('main');
    const unusedItemsRow = document.createElement('div');
    unusedItemsRow.className = 'unused-items drop';
    const addTierButton = document.createElement('button');
    addTierButton.type = 'button';
    addTierButton.textContent = 'Add Tier';
    addTierButton.addEventListener('click', async () => {
        const newTier = Tier();
        const nameResult = await newTier.editTier();
        if (!nameResult)
            return;
        TIERS.push(newTier);
        main.append(newTier.containerDiv);
    });
    const addItemButton = document.createElement('button');
    addItemButton.type = 'button';
    addItemButton.className = 'solid';
    addItemButton.textContent = 'Add Item';
    addItemButton.addEventListener('click', async () => {
        const item = await Item().editItem();
        if (!item)
            return;
        item.addThis();
    });
    const getBase64ImageSourceFromFile = (file) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            const img = document.createElement('img');
            img.title = file.name ?? '';
            img.alt = '';
            reader.addEventListener('load', (e) => {
                const result = String(e.target?.result ?? '');
                resolve(result);
            }, { once: true });
            reader.readAsDataURL(file);
        });
    };
    const getJsonFromFile = (file) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.addEventListener('load', (e) => {
                const result = String(e.target?.result ?? '');
                resolve(result);
            }, { once: true });
            reader.readAsText(file);
        });
    };
    const imagePrompt = () => {
        return new Promise(resolve => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.addEventListener('change', () => {
                const files = fileInput.files;
                if (!files?.length) {
                    resolve(null);
                }
                else {
                    const img = getBase64ImageSourceFromFile(files[0]);
                    resolve(img);
                }
            }, { once: true });
            fileInput.click();
        });
    };
    const jsonPrompt = () => {
        return new Promise(resolve => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'json';
            fileInput.addEventListener('change', () => {
                const files = fileInput.files;
                if (!files?.length) {
                    resolve(null);
                }
                else {
                    const file = files[0];
                    const str = getJsonFromFile(file);
                    resolve(str);
                }
            }, { once: true });
            fileInput.click();
        });
    };
    const header = document.createElement('header');
    const footer = document.createElement('footer');
    footer.replaceChildren(unusedItemsRow, addItemButton);
    main.replaceChildren(...TIERS.map(t => t.containerDiv));
    WRAPPER.replaceChildren(header, main, footer);
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.addEventListener('input', () => WRAPPER.style.setProperty('--color', colorPicker.value));
    colorPicker.value = '#663399';
    colorPicker.title = 'Theme';
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.textContent = '💾';
    saveButton.title = 'Save';
    saveButton.addEventListener('click', () => {
        const a = document.createElement('a');
        const data = TierList.tiers.map(tier => {
            return {
                name: tier.name,
                items: tier.items.map(item => {
                    return {
                        name: item.name,
                        src: item.src
                    };
                })
            };
        });
        const json = JSON.stringify(data);
        console.log(json);
        const fileName = `${TierList.name?.trim() ? TierList.name?.trim() : 'TierList'}.json`;
        const file = new File([(new Blob([json]))], fileName, { type: 'application/json' });
        const url = URL.createObjectURL(file);
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    });
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.textContent = '📁';
    openButton.title = 'Open';
    openButton.addEventListener('click', async () => {
        const json = await jsonPrompt();
        if (!json)
            return;
        const data = JSON.parse(json);
        load(data);
    });
    const load = (data) => {
        TIERS.length = 0;
        ITEMSET.clear();
        for (const tier of data) {
            TIERS.push(Tier(tier.name, tier.items.map(x => Item(x.name, x.src))));
        }
        main.replaceChildren(...TIERS.map(t => t.containerDiv));
    };
    header.replaceChildren(addTierButton, openButton, saveButton, colorPicker);
    if (data) {
        load(data);
    }
    return TierList;
};
const x = TIERLIST();
document.body.replaceChildren(x.element);
