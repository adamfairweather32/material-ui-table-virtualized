import React, { Component, forwardRef } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { StyledTextFieldNoBorder } from '../../styled/StyledTextField';
import StyledAutocomplete from '../../styled/StyledAutocomplete';
import { markCellIsEditing, removeCellIsEditing, removeTextSelection, isValidChar } from '../../helpers/helpers';
import { WARNING_COLOUR, ESC, DELETE, ENTER, ALPHA_NUMERIC_TYPE, UP, DOWN, LEFT, RIGHT } from '../../constants';
// import { logMe } from '../../helpers/logEverything';

const styles = () => ({
    option: {
        fontSize: 15,
        '& > span': {
            marginRight: 10,
            fontSize: 18
        }
    },
    autocompleteWrapper: {
        display: 'flex'
    },
    autocompleteRoot: {
        width: props => props.width,
        flex: '1'
    }
});
class DataTableAutoCompleteEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            focused: false,
            editing: false,
            enterEditing: false
        };
    }

    canAcceptValue = () => {
        const { column, value } = this.props;
        const {
            rich: {
                autoComplete = {
                    free: false
                }
            }
        } = column;
        const { free } = autoComplete;

        return free || (value !== '' && isNaN(value) && autoComplete.options[value]);
    };

    enterEditMode = () => {
        logger.debug('DataTableAutoCompleteEditor enterEditMode');
        const { id } = this.props;
        this.setState({
            enterEditing: true,
            editing: true
        });
        markCellIsEditing(id);
    };

    exitEditMode = (cancel = false) => {
        logger.debug('DataTableAutoCompleteEditor exitEditMode');
        const { id, onCancel, onCommit } = this.props;
        this.setState({
            enterEditing: false,
            editing: false
        });
        removeCellIsEditing(id);
        if (cancel) {
            onCancel();
        } else {
            onCommit();
        }
    };

    commitChange = () => {
        logger.debug('DataTableAutoCompleteEditor commitChange');
        const { editing } = this.state;
        if (editing) {
            const cancel = !this.canAcceptValue();
            this.exitEditMode(cancel);
        }
    };

    cancelChange = () => {
        logger.debug('DataTableAutoCompleteEditor cancelChange');
        removeTextSelection();
        this.exitEditMode(true);
    };

    handleChange = e => {
        logger.debug('DataTableAutoCompleteEditor handleChange');
        const { column, row, onCellChange } = this.props;
        const { field } = column;
        onCellChange(e.target.value, row, field);
    };

    handleKeyPress = e => {
        logger.debug('DataTableAutoCompleteEditor handleKeyPress');
        const { onCellChange, row, column } = this.props;
        const { field } = column;
        const { enterEditing } = this.state;
        if (enterEditing) {
            const char = String.fromCharCode(e.which);
            onCellChange(char, row, field);
            this.setState({
                enterEditing: false
            });
        }
    };

    handleKeyDown = e => {
        logger.debug('DataTableAutoCompleteEditor handleKeyDown');
        const { editing } = this.state;
        const { column, value, onCellChange, onActivateEditor, onDeactivateEditor, dataId, onMove, row } = this.props;
        const { clearable = false, field } = column;

        if (e.keyCode === ENTER) {
            this.commitChange();
            onDeactivateEditor();
            onMove(DOWN);
            return;
        }
        if (!editing && [UP, DOWN, LEFT, RIGHT].includes(e.keyCode)) {
            onDeactivateEditor();
            onMove(e.keyCode);
            onActivateEditor(dataId);
            return;
        }
        if (!editing && clearable && value && e.keyCode === DELETE) {
            onCellChange('', row, field, true);
            return;
        }
        if (!editing && e.keyCode !== DELETE && isValidChar(String.fromCharCode(e.keyCode), ALPHA_NUMERIC_TYPE)) {
            this.enterEditMode();
        }
        if (e.keyCode === ESC) {
            this.cancelChange();
        }
        onActivateEditor(dataId);
    };

    handleBlur = () => {
        logger.debug('DataTableAutoCompleteEditor handleBlur');
        const { onBlur, onDeactivateEditor } = this.props;
        this.setState({ focused: false, editing: false });
        this.commitChange();
        onBlur();
        onDeactivateEditor();
    };

    handleFocus = () => {
        logger.debug('DataTableAutoCompleteEditor handleFocus');
        const { onActivateEditor } = this.props;
        removeTextSelection();
        this.setState({ focused: true });
        onActivateEditor();
    };

    handleInputClick = e => {
        logger.debug('DataTableAutoCompleteEditor handleInputClick');
        const isDropdownClick =
            e.target.tagName && (e.target.tagName.toUpperCase() === 'PATH' || e.target.tagName.toUpperCase() === 'SVG');

        if (isDropdownClick) {
            const { editing } = this.state;
            if (!editing) {
                this.enterEditMode();
            } else {
                this.exitEditMode();
            }
        }
    };

    handleAutocompleteChange = (e, item) => {
        logger.debug('DataTableAutoCompleteEditor handleAutocompleteChange');
        const { id, onCellChange, row, column } = this.props;
        const { field } = column;
        if (item && item.value) {
            const { value } = item;
            this.setState({
                editing: false,
                enterEditing: false
            });
            removeCellIsEditing(id);
            onCellChange(value, row, field, true);
        }
    };

    render() {
        const { classes, id, dataId, column, value, inputRef } = this.props;
        const { focused, editing } = this.state;
        const {
            rich: {
                editable = false,
                autoComplete = {
                    free: false
                }
            }
        } = column;
        const { free, options } = autoComplete;
        const openMenu = focused && editing;
        const option = isNaN(value) && options[value]; // do not allow numbers to index into the array

        const inputProps = {
            readOnly: !editing || !editable
        };
        return (
            <div className={classes.autocompleteWrapper}>
                <StyledAutocomplete
                    id={id}
                    data-id={dataId}
                    freeSolo={free}
                    value={option || value}
                    className={classes.autocompleteRoot}
                    onChange={this.handleAutocompleteChange}
                    readOnly
                    options={options}
                    open={openMenu}
                    classes={{
                        option: classes.option
                    }}
                    getOptionLabel={option => option.label || option}
                    renderOption={option => {
                        const { customLabelBuilder, label, value } = option;
                        if (customLabelBuilder) {
                            return <>{customLabelBuilder(option)}</>;
                        }
                        return <>{label || value}</>;
                    }}
                    disableClearable
                    renderInput={params => (
                        <StyledTextFieldNoBorder
                            {...params}
                            variant="outlined"
                            inputRef={inputRef}
                            fullWidth
                            onChange={free ? this.handleChange : undefined}
                            onClick={this.handleInputClick}
                            onKeyDown={this.handleKeyDown}
                            onKeyPress={this.handleKeyPress}
                            onBlur={this.handleBlur}
                            onFocus={this.handleFocus}
                            inputProps={{
                                ...inputProps,
                                ...params.inputProps,
                                autoComplete: 'disabled',
                                style: {
                                    textOverflow: 'ellipsis'
                                }
                            }}
                        />
                    )}
                />
            </div>
        );
    }
}

export default withStyles(styles)(
    forwardRef((props, ref) => <DataTableAutoCompleteEditor {...props} inputRef={ref} />)
);
