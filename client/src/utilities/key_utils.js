// Stuff related to the formatting of the Feature Popups.

const KeyType = Object.freeze({
    NORM: 0,
    NUMBER: 1,
    DATETIME: 2,
  });

const keyMap = {
    "CalculatedAcres": ["Acres", 1, KeyType.NUMBER],
    "ContainmentDateTime": ["Containment Date", 1, KeyType.DATETIME],
    "ControlDateTime": ["Controlled Date", 1, KeyType.DATETIME],
    "DailyAcres": ["Daily Acres", 1, KeyType.NUMBER],
    "DiscoveryAcres": ["Discovery Acres", 1, KeyType.NUMBER],
    "Fatalities": ["Fatalities", 1, KeyType.NUMBER],
    "FinalAcres": ["Final Acres", 0, KeyType.NUMBER],
    "FireCause": ["Fire Cause", 1, KeyType.NORM],
    "FireCauseGeneral": ["Fire Cause", 0, KeyType.NORM],
    "FireDiscoveryAge": ["Fire Discovery Age", 0, KeyType.NORM],
    "FireDiscoveryDateTime": ["Fire Discovery DT", 1, KeyType.DATETIME],
    "FireMgmtComplexity": ["Fire Management Complexity", 0, KeyType.NORM],
    "FireOutDateTime": ["Fire Out Date", 1, KeyType.DATETIME],
    "GACC": ["G A C C", 0, KeyType.NORM],
    "GlobalID": ["Global ID", 0, KeyType.NORM],
    "ICS209ReportDateTime": ["ICS 209 Report DT", 0, KeyType.DATETIME],
    "IncidentManagementOrganization": ["Incident Management Organization", 0, KeyType.NORM],
    "IncidentName": ["Incident Name", 0, KeyType.NORM],
    "IncidentTypeCategory": ["Incident Type Category", 0, KeyType.NORM],
    "IncidentTypeKind": ["Incident Type Kind", 0, KeyType.NORM],
    "Injuries": ["Injuries", 1, KeyType.NUMBER],
    "IrwinID": ["Irwin ID", 0, KeyType.NORM],
    "IsValid": ["Is Valid", 0, KeyType.NORM],
    "ModifiedOnAge": ["Modified On Age", 0, KeyType.NORM],
    "ModifiedOnDateTime": ["Modified On Date Time", 0, KeyType.DATETIME],
    "OBJECTID": ["Object ID", 0, KeyType.NORM],
    "OtherStructuresDestroyed": ["Other Structures Destroyed", 0, KeyType.NUMBER],
    "POOCounty": ["County", 1, KeyType.NORM],
    "POOState": ["State", 1, KeyType.NORM],
    "PercentContained": ["Percent Contained", 1, KeyType.NORM],
    "PredominantFuelGroup": ["Predominant Fuel Group", 0, KeyType.NORM],
    "PredominantFuelModel": ["Predominant Fuel Model", 0, KeyType.NORM],
    "PrimaryFuelModel": ["Primary Fuel Model", 0, KeyType.NORM],
    "ResidencesDestroyed": ["Residences Destroyed", 1, KeyType.NORM],
    "TotalIncidentPersonnel": ["Total Incident Personnel", 1, KeyType.NORM],
    "UniqueFireIdentifier": ["Unique Fire Identifier", 1, KeyType.NORM]
};

export function importantKey(key)
{
    if(keyMap.hasOwnProperty(key))
        return keyMap[key][1];

    return 1;
}

function timestampToDate(timestamp){
    const date = new Date(timestamp);

    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();

    const formattedDate = `${mm}/${dd}/${yyyy}`;

    return formattedDate;
}

export function ValueFormat(key, value){
    if(!keyMap.hasOwnProperty(key))
        return value;
        
    if(keyMap[key][2] == KeyType.DATETIME){
        return timestampToDate(value);
    }
    
    if(keyMap[key][2] == KeyType.NUMBER){
        return value.toLocaleString('en');
    }

    return value;
}

export function keyTranslate(key){
    if(keyMap.hasOwnProperty(key))
        return keyMap[key][0];

    return key;
}