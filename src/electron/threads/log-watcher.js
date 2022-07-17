const { ipcRenderer, ipcMain } = require( 'electron' );
const path = require( 'path' );
const process = require( 'process' );
const fs = require( 'fs' );
const customAlphabet = require( 'nanoid' ).customAlphabet;
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet( alphabet, 16 );
const _ = require( 'lodash' );


var currentPosition = null;

var logParseTimeoutId = null;
var logParseTimer = 50;
var dumpFileCheckTimer = 1500;
var logFilename = null;
/** @type {string} */
var characterName = null;

/** @type {RegExp} */
var bidStarted = null;
/** @type {RegExp} */
var bidder = null;
/** @type {RegExp} */
var skadd = null;
var charLeftRaid = /^(?<character>.*) has left the raid\.$/gi;
var charJoinedRaid = /^(?<character>\w+) joined the raid\.$/gi;
// var bidStarted = /^(?:You|Embrey|Roseflower) (?:tells the|tell your) (?:raid|guild), '[X|x]:\s+(.*)'$/gi;
// var bidder = /^(?<character>.*) (?:tells the|tell your) (?:raid|guild), '[X|x]*\s*'$/gi;

/** @type {string[]} */
var processedRaidDumps = [];










/**
 * Initializes the log watcher.
 * 
 * @param {string} logFile The file to watch.
 * @param {string} charName The character name for You.
 * @param {string} suicideBidSymbol The match symbol for bidding on items.
 * @param {string[]} suicideBidTakers The the authorized characters for starting bids.
 */
function LogWatcher( logFile, charName, suicideBidSymbol, suicideBidTakers ) {
    
    // let bidTakers = [ 'Embrey', 'Roseflower' ];
    // let bidSymbol = 'x';

    // You|Embrey|Roseflower
    // X|x

    suicideBidTakers = suicideBidTakers?.length > 0 ? suicideBidTakers : [];

    suicideBidTakers.unshift( 'You' );

    characterName = charName;
    bidStarted = new RegExp( `^(?:${suicideBidTakers.join( '|' )}) (?:tells the|tell your|say to your) (?:raid|guild), '[${suicideBidSymbol.toLowerCase()}]:\\s+(?<article>.*)'$`, 'gi' );
    bidder = new RegExp( `^(?<character>.*) (?:tells the|tell your|say to your) (?:raid|guild), '[${suicideBidSymbol.toLowerCase()}]+\\s*'$`, 'gi' );
    skadd = new RegExp( `^(?<character>.*) (?:tells the|tell your|say to your) (?:raid|guild), '!skadd`, 'gi' );
    
    watchLogFile( logFile );

}

/**
 * Initializes the raid dump watcher.
 * 
 * @param {string} logFile The current log file path.
 */
function initWatchForNewRaidDumps( logFile ) {
    
    let logMatch = /^.+eqlog_(?:.*)_(?<server>.*)\.txt$/gi.exec( logFile );
    if ( logMatch ) {
        let serverName = logMatch.groups.server;
        let dumpMatcher = new RegExp( `^.*RaidRoster_${serverName}-(?<year>[0-9]{4})(?<month>[0-9]{2})(?<day>[0-9]{2})-(?<hour>[0-9]{2})(?<min>[0-9]{2})(?<sec>[0-9]{2})\\.txt$`, 'gi' );
        let fileMatch = /\\Logs\\eqlog_.*?_.*?.txt/gi.exec( logFile );
        let eqPath = logFile.substring( 0, fileMatch.index );
    
        // RaidRoster_firiona-20210504-202343.txt
        let files = fs.readdirSync( eqPath );
    
        files?.forEach( file => {
            let match = dumpMatcher.exec( file );
            if ( match?.groups ) {
                processedRaidDumps.push( file );
            }
            dumpMatcher.lastIndex = 0;
        } );
    
        setTimeout( () => { watchForNewRaidDumps( eqPath, dumpMatcher ); }, dumpFileCheckTimer );
    }
}

/**
 * Watches the given folder, using the given regex, for new raid dump files and 
 * emits the contents of those files.
 * 
 * @param {string} eqPath The everquest path folder.
 * @param {RegExp} dumpMatcher The regular expression for matching raid dump files.
 */
function watchForNewRaidDumps( eqPath, dumpMatcher ) {

    let files = fs.readdirSync( eqPath );

    files?.forEach( file => {
        let match = dumpMatcher.exec( file );
        if ( match?.groups ) {
            if ( processedRaidDumps.indexOf( file ) < 0 ) {
                // send to processing
                ipcRenderer.send( 'log:raid:dumpDetected', fs.readFileSync( path.join( eqPath, file ) ).toString() );
                processedRaidDumps.push( file );
            }
        }
        dumpMatcher.lastIndex = 0;
    } );
    
    window.setTimeout( () => { watchForNewRaidDumps( eqPath, dumpMatcher ); }, dumpFileCheckTimer );
}

function watchLogFile( logFile ) {
    
    initWatchForNewRaidDumps( logFile );

    logFilename = logFile;

    function startParsingLogFile() {
        fs.open( logFilename, 'r', function ( err, fd ) {

            if ( fd ) {
                var file = fd;
                
                currentPosition = currentPosition === null ? fs.fstatSync( file ).size : currentPosition;

                function parseLogFile() {
                    var stats = fs.fstatSync( fd );
                    var file = fd;
    
                    // When another application deletes the file (Gina/GamParse).
                    if ( currentPosition > stats.size || !fs.existsSync( logFilename ) ) {
                        
                        // Reset the current position.
                        currentPosition = null;

                        // Start over after logParseTimer milliseconds.
                        logParseTimeoutId = window.setTimeout( startParsingLogFile, logParseTimer );

                        return;
                    }
                        
                    fs.read( file, Buffer.alloc( stats.size - currentPosition ), 0, stats.size - currentPosition, currentPosition, ( err, bytecount, buff ) => {
                        
                        currentPosition += bytecount;
                        let read = buff.toString( 'utf-8', 0, bytecount );
                        let lines = read.split( /\r\n|\r|\n/gmi );
                        
                        lines.forEach( line => {
                            if ( line && line.length > 0 ) {
                                parseLogEntries( line );
                            }
                        } );

                    } );

                    logParseTimeoutId = window.setTimeout( () => parseLogFile(), logParseTimer );
                }

                // Start polling the log file every logParseTimer milliseconds.
                logParseTimeoutId = window.setTimeout( () => parseLogFile(), logParseTimer );

            } else {
                // If the log file was not found, then start over.
                logParseTimeoutId = window.setTimeout( () => startParsingLogFile(), logParseTimer );
            }
        } );
    }


    if ( logParseTimeoutId > 0 ) {
        window.clearTimeout( logParseTimeoutId );
        currentPosition = null;
        startParsingLogFile();
    } else {
        window.setTimeout( () => {
            currentPosition = null;
            startParsingLogFile();
        }, logParseTimer );
    }

}










/**
 * Parses the given log entry.
 * 
 * @param {string} raw The raw log entry.
 * @param {boolean} simulating If true, only simulates executing triggers via a consol.log call.
 */
function parseLogEntries( raw, simulating ) {
    
    simulating = simulating === true ? true : false;

    // let rgxTrigger = /grats;/gi;
    let rgxTimestamp = /^\[(.*?)\]\s*/gi;
    // let rgxGrabText = /\'(.*?)\'$/gi;
    // let rgxDelimiter = /;/gi;
    // let rgxNum = /(\d+)/gi;
    // let rgxCombatText = /hit|damage|miss|dodge|riposte|parry|become better|backstab|stun|attack/gi;
    // let rgxFctCritical = /\. \(.*(Critical).*\)/gi;
    
    // let fctRegExs = [
    //     // 0: rgxMelee
    //     /You ([a-zA-Z0-9_]*) (.*) for ([0-9]*) points of damage\./gi,
    //     // 1: rgxMeleeMiss
    //     /You try to ([a-zA-Z0-9_]*) (.*),/gi,
    //     // 2: rgxSpellDmg
    //     /(.*) has taken ([0-9]*) damage from your (.*)\./gi,
    //     // 3: rgxThorns
    //     /(.*) is pierced by YOUR thorns for ([0-9]*) points of non-melee damage\./gi,
    //     // 4: rgxSkillUp
    //     /You have become better at ([a-zA-Z0-9_]*)! \(([0-9]*)\)/gi,
    //     // 5: rgxTakeMeleeDmg
    //     /(.*) ([a-zA-Z0-9_]*) YOU for ([0-9]*) points of damage\./gi,
    //     // 6: rgxAvoidMeleeDmg
    //     /(.*) tries to ([a-zA-Z0-9_]*) YOU, but ([a-zA-Z0-9_\s]*)/gi,
    //     // 7: rgxTakeSpellDmg
    //     /(.*) hit you for ([0-9]*) points of ([a-zA-Z0-9_]*) damage by (.*)\./gi,
    //     // 8: rgxSpellDmg
    //     /You ([a-zA-Z0-9_]*) (.*) for ([0-9]*) points of (.*) damage by (.*)\./gi,
    // ];

    // TODO: Remove timestamp.
    let timestamp = new Date( rgxTimestamp.exec( raw )[ 1 ] );

    if ( !timestamp || timestamp.length === 0 || timestamp.length === 1 )
        console.log( 'failed parse', raw );
    
    let log = raw.replace( rgxTimestamp, '' );

    let matchFound = false;
    let bidderMatch = bidder.exec( log );

    if ( bidderMatch?.groups?.character ) {
        let character = bidderMatch.groups.character === 'You' ? characterName : bidderMatch.groups.character;

        if ( character ) {
            ipcRenderer.send( 'log:event:characterBidded', character );
        }

        matchFound = true;
    }

    let leaveMatch = matchFound ? null : charLeftRaid.exec( log );
    if ( leaveMatch?.groups?.character ) {
        ipcRenderer.send( 'log:event:characterLeft', leaveMatch?.groups?.character );
        matchFound = true;
    }

    let joinedMatch = matchFound ? null : charJoinedRaid.exec( log );
    if ( joinedMatch?.groups?.character ) {
        ipcRenderer.send( 'log:event:characterJoined', joinedMatch?.groups?.character );
        matchFound = true;
    }

    let bidStartedMatch = matchFound ? null : bidStarted.exec( log );
    if ( bidStartedMatch?.groups?.article ) {
        ipcRenderer.send( 'log:event:bidStarted', bidStartedMatch?.groups?.article );
        matchFound = true;
    }

    let skaddMatch = skadd.exec( log );
    if ( skaddMatch?.groups?.character ) {
        let character = skaddMatch.groups.character === 'You' ? characterName : skaddMatch.groups.character;
        if ( character ) {
            this.ipcRenderer.send( 'standby_raider', character );
        }
    }


    bidder.lastIndex = 0;
    charLeftRaid.lastIndex = 0;
    charJoinedRaid.lastIndex = 0;
    bidStarted.lastIndex = 0;
}

module.exports = LogWatcher;

// Capture spell being cast
// You begin casting Cascading Darkness.

// Exit conditions (casting)
//X A loathling lich resisted your Cascading Darkness!
//X Your Envenomed Bolt spell is interrupted.
//X Your Journeyman Boots spell did not take hold. (Blocked by Pack Spirit.)

// Exit conditions (timer)
//  A black wolf has been slain by Grimrot!
//  You have slain a black wolf!

// ^You hit (.*) for 5 points of disease damage by ${SpellBeingCast}\.
// ^You hit (.*) for ([0-9]*) ?points of (.*)? ?damage by Poison Bolt\.

// Spell lands:
//  On Hit:
//        You hit a black wolf for 41 points of poison damage by Envenomed Bolt.
//        You hit (          ) for ()                         by (            )
//  On Tick 1:
//        A black wolf has taken 10 damage from your Envenomed Bolt.
//        (          )           ()             your (            )


// ***
// [Fri Oct 02 09:34:19 2020] You begin casting Funeral Pyre of Kelador.
// ***
// [Fri Oct 02 09:34:21 2020] a carrion beetle hatchling is enveloped in a funeral pyre.
// ***
// [Fri Oct 02 09:34:25 2020] A carrion beetle hatchling has taken 350 damage from your Funeral Pyre of Kelador.
// ***
// [Fri Oct 02 09:34:25 2020] You have slain a carrion beetle hatchling!

// [Thu Jun 06 23:22:28 2019] Azryl has fallen to the ground.
// [Thu Nov 05 00:31:50 2020] You are no longer feigning death, because a spell hit you.